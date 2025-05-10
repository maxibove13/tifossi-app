Plexo Integration Technical Guide (Mobile App + Node.js Backend)
A. Initial Setup and Credentials
Obtain Plexo API Credentials – Before development, request Plexo support to provision your e-commerce as a client on their platform. They will provide a unique ClientName and a .PFX certificate (with password) associated with your client
plexo.gitbook.io
. The certificate’s private key is used to digitally sign all JSON requests from your backend to Plexo. These credentials are mandatory to authenticate and secure every API call.
Register Callback URL for Tokens – You must also supply Plexo with a server callback URL where they will POST payment instrument tokens upon user checkout
plexo.gitbook.io
. Plexo uses this URL to deliver the tokenized card (or other payment instrument) data after the customer enters payment details. Ensure your backend can receive HTTPS POST requests at this URL. (This is sometimes called an InstrumentCallback in Plexo docs.)
Setup Merchant and Payment Methods – In Plexo, your “Client” represents the overall e-commerce, which can contain one or more merchants (commerce accounts). Typically, you’ll have one merchant corresponding to your store. Plexo support may need to configure this merchant and enable payment methods (e.g. Visa, MasterCard, etc.) for it. For initial testing, ask support for test merchant account data (e.g. test card processor IDs, merchant numbers) and configure at least one payment method
plexo.gitbook.io
. This can be done via Plexo’s API (“Alta de comercio” – create merchant), but it’s usually easiest to have Plexo set up a test merchant with test credentials. Having a merchant and payment method configured is required before you can authorize a payment session.
Test vs. Production Environment – Plexo provides a testing environment (sandbox) and a production environment, each with different endpoints and certificates. The test gateway base URL is https://testing.plexo.com.uy:4043/SecurePaymentGateway.svc
plexo.gitbook.io
. The production URL is similar (e.g. https://pagos.plexo.com.uy:4043/SecurePaymentGateway.svc). You will likely receive a different PFX certificate for production. Plan to request production credentials and certificate from the client/Plexo when ready to go live. Keep track of the correct gateway URL and cert for each environment in your configuration.
Note: The PFX certificate contains your private key – store it securely (e.g. do not commit it to source control). You will need its password (provided by Plexo) to use it in your Node.js backend for signing requests.
B. Integration Architecture and Flow Overview
Architecture Summary – All interactions with Plexo will be handled by the Node.js/Express backend, not directly by the React Native app. The mobile app will never send sensitive payment data to your server; instead, it will load Plexo’s secure web form to collect card details. This design ensures PCI compliance and keeps private keys safely on the server side
plexo.gitbook.io
plexo.gitbook.io
. The high-level flow is:
Mobile app requests a payment session from your backend.
Backend calls Plexo’s API (with signed request) to create an Authorization (user session).
Plexo returns a SessionId and a URL for the payment web form.
Mobile app opens that URL (Plexo’s hosted form) in a WebView (embedded browser).
User enters or selects payment details on Plexo’s form. No card data touches the app or your servers.
Upon completion, Plexo calls your backend’s callback URL with a tokenized payment instrument.
Backend acknowledges receipt, then (optionally) executes the payment transaction via Plexo’s API using that token.
Plexo processes the payment and returns the result to the backend. For certain methods, a follow-up callback may confirm final status.
Why Use Backend as Proxy – Plexo’s APIs require each request to be signed with your private key (from the PFX). This is not feasible on the client-side (you cannot safely store a private key in a mobile app). Moreover, the embedded payment page approach means the app itself never handles raw card numbers
plexo.gitbook.io
. Plexo is PCI-DSS certified, and by embedding their hosted form, you offload all sensitive data handling to them
plexo.gitbook.io
. The backend-centric design centralizes the secure operations (signing requests, storing tokens, handling webhooks) on your server, which is easier to secure and maintain.
End-to-End Payment Flow – Below is an outline of the full payment flow in sequence:
(A) Client App -> Backend: User initiates a checkout on the app. The app calls your backend (e.g., POST /create-payment-session) with details like order amount, currency, and maybe user identifier.
(B) Backend -> Plexo (Authorization): Your backend constructs an Authorization request (JSON) including the transaction details (amount, etc.), user info, and a redirect URL, then signs it with the PFX and POSTs to Plexo’s authorize endpoint
plexo.gitbook.io
plexo.gitbook.io
. This creates a payment session.
(C) Backend -> App: The backend responds to the app with the SessionId or the full URL of Plexo’s payment page (e.g. https://web.testing.plexo.com.uy/{SessionId})
plexo.gitbook.io
.
(D) App -> Plexo (User Payment Page): The React Native app opens a WebView (in-app browser) pointing to the Plexo URL. Plexo’s hosted payment form loads (branded with your styles if configured) and the user enters their card or selects a saved method. This is all within the Plexo web context.
(E) Plexo -> Backend (Token Callback): When the user submits their payment info, Plexo tokenizes it and sends an HTTPS POST to your backend callback URL (registered in step A.2) containing the Payment Instrument Token and details (last4, expiry, type, etc.)
plexo.gitbook.io
plexo.gitbook.io
. Your backend must verify the signature and store this token.
(F) Backend -> Plexo (Acknowledge): Your backend replies to Plexo’s callback with a signed ClientSignedResponse (contains a code and an optional message) to acknowledge receipt
plexo.gitbook.io
. Plexo’s web form, upon receiving this, will redirect the WebView to the specified RedirectUri (from the Authorization request).
(G) Plexo Web -> App (Redirect): The WebView in the app navigates to the Redirect URI (which you set to a special URL, e.g., a custom scheme or an endpoint that your app can detect). The RN app intercepts this redirect, closes the WebView, and regains control knowing the tokenization step is finished.
(H) Backend -> Plexo (Payment Execution): Now that a token is obtained, your backend can (either automatically or upon app request) initiate the actual charge by calling Plexo’s Purchase API with the token, amount, etc.
plexo.gitbook.io
. This request is also signed with your cert. Plexo processes the payment with the underlying payment processor.
(I) Plexo -> Backend (Payment Result): Plexo returns a response to the purchase request indicating success or failure with a result code and transaction details
plexo.gitbook.io
. In synchronous cases (e.g., credit card), this is the final confirmation. In asynchronous cases (e.g., certain bank payments), the initial response may indicate a pending state, and Plexo will later send a PaymentCallback webhook to your backend with the final outcome
plexo.gitbook.io
. (The PaymentCallback is similar to the token callback, but contains the transaction status.)
(J) Backend -> App (Order Update): Finally, your backend can inform the app of the payment result (e.g., via the API response or a fresh request from the app to check order status). The app can then proceed to confirmation UI (receipt, etc.).
Throughout this process, all communication between your backend and Plexo is over TLS and signed with digital signatures for integrity and authentication
plexo.gitbook.io
.
C. Step 1: Authorization – Creating a Payment Session
Purpose of Authorization – The Authorization step initializes a payment session with Plexo. It is the first backend API call in the flow
plexo.gitbook.io
. This call returns a SessionId (session token) that represents the user’s checkout session and is used to load the payment form. It also associates configuration options (like which actions the user can perform, which payment methods to show) with that session on Plexo’s side.
Endpoint and Request – The Authorization is a POST to Plexo’s secure gateway (e.g. .../SecurePaymentGateway.svc/Operation/Authorize). The request body is a signed JSON object. At a high level, the JSON looks like this (values to be adjusted):
json
Copy
Edit
{
  "Object": {
    "Fingerprint": "<hash_of_cert_key>", 
    "Object": {
      "Client": "<YourClientName>",
      "Request": {
        "Action": 3,
        "ClientInformation": {
           "Name": "John Doe",
           "Email": "[email protected]",
           // ...other optional customer info
        },
        "DoNotUseCallback": false,
        "MetaReference": "user12345", 
        "RedirectUri": "myapp://paymentDone", 
        "Type": 0
      }
    },
    "UTCUnixTimeExpiration": 1700000000000
  },
  "Signature": "<Base64Signature>"
}
plexo.gitbook.io
plexo.gitbook.io
The outer structure includes your Client name and a Request object with details.
Action: A bit-flag numeric value indicating what the user is allowed to do in the upcoming payment web page. Common values:
1 = Select an existing payment instrument,
2 = Register a new instrument,
3 = Both select or register (as in the example above, Action:3 allows the user to choose a saved card or add a new one)
plexo.gitbook.io
.
Plexo also defines other flags (e.g., 64 for ExpressCheckout, see Section F).
ClientInformation: (Optional) Info about the end-user (name, address, ID, etc.). Not strictly required for basic card tokenization, but can be provided for record-keeping or if certain payment methods need it
plexo.gitbook.io
.
DoNotUseCallback: By default this is false – meaning Plexo will use the server callback to return the token. (If set to true, Plexo would not call your server; instead you’d have to retrieve the token via other means. In our architecture, keep this false so the backend gets the token via webhook
plexo.gitbook.io
.)
MetaReference: A client-defined user reference. If you want Plexo to treat the user as identified (so their token can be reused later), set this to a unique identifier for the customer (e.g. an email or user ID) and choose an appropriate Type (see below)
plexo.gitbook.io
. For example, "MetaReference": "[email protected]".
RedirectUri: The URL to which Plexo will redirect when the web form interaction is finished
plexo.gitbook.io
. In a mobile app, this is typically a custom URI scheme or deep link that your app can handle (e.g., myapp://paymentDone). It could also be a dummy localhost URL if you plan to intercept it in the WebView. This allows your app to detect when to close the WebView.
Type: The authorization type – essentially how Plexo ties the session to a user. Options:
0 = ClientReference (identified user)
plexo.gitbook.io
. Use this if you provided a MetaReference (e.g. a user ID or email). Tokens generated will persist for that user.
1 = Anonymous. Use if the user is not identified – the token will only live for ~24 hours
plexo.gitbook.io
. (Anonymous is not common for logged-in app users because you usually want to save their card for reuse.)
There are also OAuth options (not covered here). In most cases, you’ll use Type:0 with a MetaReference, so that the card token can be stored and reused for that user
plexo.gitbook.io
.
LimitIssuers / LimitBanks (optional): You can restrict which payment providers the user can use for this session. For instance, LimitIssuers: ["4","11"] might limit to Mastercard (4) and Visa (11) only. These IDs correspond to payment method IDs in Plexo’s system. If not set, all configured methods for the merchant are available
plexo.gitbook.io
.
UTCUnixTimeExpiration: A timestamp (Unix epoch in ms) indicating until when the request is valid. It’s included in the signature. Typically set to now + a short interval. Plexo will reject the request if the signature is outside this time window
plexo.gitbook.io
plexo.gitbook.io
.
Signing the Authorization Request – You must canonicalize and sign the JSON before sending. Plexo requires a SHA512 with RSA signature (PKCS#1 v1.5 padding) using your private key
plexo.gitbook.io
plexo.gitbook.io
. The signature goes into the "Signature" field, and the Fingerprint field is a hash identifier of which key is used (Plexo provides this with the cert). If you use Plexo’s .NET SDK, this is handled automatically. In Node.js, you’ll likely use the crypto module – load your .pfx (perhaps convert to a PEM), canonicalize the JSON (sort keys, remove nulls, default missing enums as described in Plexo docs
plexo.gitbook.io
plexo.gitbook.io
), then sign and Base64-encode it. This is complex, so start with their examples. Tip: If signing is implemented incorrectly, Plexo will respond with an error and include the exact JSON string it expected for signing
plexo.gitbook.io
 – use that to debug your signing routine.
Authorization Response – If the request is correct, Plexo responds with a JSON containing at least:
Id: the SessionId for this authorization
plexo.gitbook.io
.
Uri: the full URL of the hosted payment page for this session (usually https://web.testing.plexo.com.uy/{SessionId})
plexo.gitbook.io
.
ExpirationUTC: expiration time for the session (epoch seconds).
ResultCode: 0 for success (non-zero if an error occurred)
plexo.gitbook.io
.
Your backend should extract the Session Id or Uri and return it to the mobile app. For example, an Authorization response might look like:
json
Copy
Edit
{
  "ExpirationUTC": 1505192898,
  "Id": "c24cb52e05dd4e6295fbc318e9b52bb2",
  "Uri": "https://web.testing.plexo.com.uy/c24cb52e05dd4e6295fbc318e9b52bb2",
  "ResultCode": 0
}
plexo.gitbook.io
 If ResultCode is not 0, the authorization failed (signature error, invalid data, etc.). Use the error message (if provided) or check logs to troubleshoot. Common issues at this stage are incorrect signatures.
Storing Context – It’s a good practice to store the SessionId on your backend along with the order/payment request context (e.g., which user and order it’s for). Though Plexo will also return it back in callbacks, having it in your system helps match things up. Also note the RedirectUri you sent – your app should know to handle it when the WebView triggers it.
D. Step 2: Displaying the Plexo Payment Page (Web Integration)
Loading the Payment Form – After receiving the SessionId/Uri, the mobile app opens Plexo’s payment page in a WebView. For example, using React Native’s WebView component, you might do:
jsx
Copy
Edit
<WebView 
    source={{ uri: sessionUrl }} 
    onNavigationStateChange={handleNavChange} 
/>
where sessionUrl is the Uri from the Authorization response. This loads Plexo’s hosted checkout page for that session
plexo.gitbook.io
. The page will present the user with options to either select a saved card (if any on file for this user and Action allowed it) or enter a new card (or other payment method).
User Experience in WebView – Plexo’s embedded page is designed to look like part of your app/website (“as if it were in the e-commerce site”
plexo.gitbook.io
). It is not an external redirect; the user stays within your app’s context. The page is loaded over HTTPS from Plexo’s domain and is fully PCI-DSS compliant for capturing sensitive data
plexo.gitbook.io
plexo.gitbook.io
. The user will input card details (or select an existing token if offered). Plexo supports various payment instruments (credit, debit, prepaid cards, possibly bank or cash voucher methods depending on configuration). The form may ask for additional info depending on the method (e.g., cardholder name, expiration, CVV, etc.).
WebView Configuration – Ensure the WebView allows JavaScript (Plexo’s form likely uses JS) and is in a context where it can reach the internet. If possible, disable any caching of form or prevent going back. Monitor the WebView’s URL changes via onNavigationStateChange or similar:
When the WebView eventually navigates to the RedirectUri you provided (e.g., myapp://paymentDone), you should intercept it. In React Native, you might get a callback when navigation occurs. Detect that the URL starts with your custom scheme, then close the WebView and signal completion to your app logic.
It’s important that the RedirectUri is unique enough to catch (some use a custom scheme or a specific path on your domain). For example, https://yourdomain/checkout/done could work if you intercept that, but a custom scheme like myapp://done is more foolproof in an app environment.
Handling User Actions – If the user decides to cancel the payment while on the Plexo form (e.g., closes the WebView manually), you might not get an immediate notification from Plexo (since no submission happened). You should handle WebView closure as a cancellation in your app. Plexo does provide an API to Cancel a purchase (which is actually a refund if payment was already made)
plexo.gitbook.io
, but if the user simply abandons at the form stage, no token will be generated. In such cases, you can call Plexo’s Cancel session if needed or just invalidate that session on your side.
Security in the Web Context – All data entered in the Plexo web form is transmitted directly to Plexo’s servers (not through your app or backend)
plexo.gitbook.io
. This ensures that card numbers and CVV never touch your app’s code. The WebView essentially acts as a secure mini-browser. Make sure to use https://web.testing.plexo.com.uy/... (or the production equivalent) exactly as given in the Authorization response to avoid any man-in-the-middle. Do not attempt to scrape or intercept fields in the WebView; treat it as a black-box payment terminal.
E. Step 3: Backend Callback – Receiving the Payment Token
Instrument Callback from Plexo – Once the user finishes entering payment info and submits on the Plexo page, Plexo will generate a token for the payment instrument. They will then send an HTTPS POST to the callback URL you provided to them (see Section A.2)
plexo.gitbook.io
. This server-to-server call contains a JSON payload (signed by Plexo) with details of the selected/registered payment method, known as an InstrumentCallback.
Callback Data Contents – The callback JSON (after you verify its signature) contains:
SessionId: The session identifier for the transaction (so you know which Authorization session this belongs to)
plexo.gitbook.io
.
PaymentInstrument: An object with details of the payment method the user chose or entered:
InstrumentToken: The token string that represents the card or account
plexo.gitbook.io
. This token is what you use to charge the customer in the next step. Treat it as sensitive (it’s not a card number, but it can be used to charge).
Expiration: Expiry date of the card (if card) or validity of the instrument.
InstrumentName: A friendly name or masked number (e.g., "520394XXXXXX3450" for a MasterCard)
plexo.gitbook.io
.
Issuer: Info about the payment provider (e.g., Issuer ID, name like Visa, MasterCard, etc., possibly an image URL for the brand)
plexo.gitbook.io
.
AdditionalRequirements: A list of any additional required info for using this token. For example, it may indicate that a CVV is required at payment time (“CVC”) or other items
plexo.gitbook.io
. (Most card tokens will require CVV at payment unless 3-D Secure was done or the processor rules say otherwise.)
… (Other fields like last 4 digits, card type, etc., can be present.)
Plexo’s docs note that if you requested extra BIN info, it could be included as well (e.g., bank issuer data)
plexo.gitbook.io
.
Implementing the Callback Endpoint – You need to create an endpoint on your Node/Express backend to handle this POST. For example, if you gave Plexo https://api.myserver.com/plexo/callback, then implement a route for POST /plexo/callback. In this handler:
Parse the JSON body.
Verify Plexo’s signature on the incoming message using Plexo’s public key (they provide an endpoint to fetch their public key
plexo.gitbook.io
plexo.gitbook.io
). This ensures the request truly came from Plexo and wasn’t tampered with.
Extract the InstrumentToken and related info.
Lookup the session (you might use SessionId or MetaReference to find the associated user/order in your system).
Store the token in your database if you want to reuse it for future purchases (associate it with the user’s account if applicable). Important: Only store the token, not any raw card data. The token by itself is useless outside Plexo/Plexo’s API.
Prepare a response.
Acknowledging the Callback – Plexo expects your server to respond to the token callback with a ClientSignedResponse object
plexo.gitbook.io
. This is a small JSON indicating you received the token successfully. It must be signed with your private key, similar to other messages:
json
Copy
Edit
{
  "Object": {
    "Code": 0,
    "Message": "OK"
  },
  "Signature": "<...>"
}
Code: Use 0 for success, or another code if you want to indicate an error (non-zero might tell Plexo that you failed to process the token).
Message: (Optional) You can send a string message. It can be something like "OK" or a description of an error if Code is non-zero
plexo.gitbook.io
.
Sign this response with your cert (Plexo will verify it).
Once Plexo receives this positive acknowledgment, it will proceed to redirect the user’s web session to the RedirectUri. If you fail to respond or send a non-zero code, the Plexo web form might show an error to the user or not redirect properly. In general, respond with Code 0 as quickly as possible. Do any heavy processing (like database writes) asynchronously if needed, to avoid delaying the response.
After the Callback – At this point, the user’s WebView is redirected back to your app (RedirectUri). The app should close the WebView. You now have the payment instrument token on your backend. Note: The token callback indicates the user successfully provided payment details, but the payment is not yet completed. The next step is for your backend to actually perform the charge using the token. You have a choice: you can initiate the payment immediately upon receiving the token (before redirecting the user), or you can wait for the app to trigger it. A common approach is to attempt the charge immediately and only redirect the user after you know the result – but since Plexo’s flow requires the redirect upon token callback, you’ll likely charge after the token step and handle final confirmation separately (e.g., show a loading then success screen in app after WebView closes, by querying backend for result).
Note: If you prefer a one-step flow (tokenize + charge in one web interaction), Plexo supports an ExpressCheckout mode (see Section F.5) which combines steps C–F. However, in our architecture we’re using the two-step approach for clarity and control.
F. Step 4: Executing the Payment (Charge the Token)
Initiating the Payment – To charge the customer, your backend calls Plexo’s Purchase operation (also referred to as “Realizar pago”)
plexo.gitbook.io
. This is a POST request to the /Operation/Purchase endpoint on the Plexo gateway, with a signed JSON payload containing the token and transaction details. Only do this after receiving the InstrumentToken (unless using ExpressCheckout).
Payment Request Data – The JSON structure for a payment (Purchase) request will include:
ClientReferenceId: A unique ID for this transaction on your side
plexo.gitbook.io
. This could be an order number or a UUID. It’s used for traceability and also can be used as a reference if you need to do refunds or status checks.
CurrencyId: Numeric code for the currency
plexo.gitbook.io
. (In Plexo’s system, 1 might be Uruguayan Peso, 2 US Dollar, etc. Confirm the codes with Plexo’s docs or support. The example shows 1=Peso
plexo.gitbook.io
.)
Amount / BilledAmount: The total amount to charge. Typically you will include this in the FinancialInclusion object:
FinancialInclusion: Contains tax breakdown if needed (for Uruguay’s fiscal law)
plexo.gitbook.io
. At minimum, BilledAmount (gross amount), and optional tax details like TaxedAmount, VATAmount, etc., plus a Type code for the law (e.g., 0 if not applicable)
plexo.gitbook.io
plexo.gitbook.io
. For basic integration, if you’re not concerned with these details, you might still need to send BilledAmount equal to the total, and Type:0.
InvoiceNumber: If you have an invoice or ticket number for the sale, you can send it in FinancialInclusion as well
plexo.gitbook.io
.
Installments: Number of installments for the payment (if supported)
plexo.gitbook.io
. For example, if you allow paying in 3 installments on a credit card, put 3. If not applicable, use 1. Plexo will handle installment logic with the acquirer.
Items: A list of line-item details (optional, primarily used for ExpressCheckout UI)
plexo.gitbook.io
. Each item can include Name, Description, Quantity, and Amount
plexo.gitbook.io
. This info may be shown to the user if using ExpressCheckout’s combined page. For a standard card charge, this is optional; you may omit items or just send a single item that represents the order.
PaymentInstrumentInput: This object carries the token and any required supplementary info for the payment
plexo.gitbook.io
. It should include:
InstrumentToken: (String) the token you received in the callback
plexo.gitbook.io
.
OptionalFields/Values: If the payment method requires additional inputs not stored in the token. For example, some cards require the CVV for each charge, even if tokenized. In such a case, you need to prompt the user for their card’s CVV in your app (since the Plexo form might not have stored CVV) and include it here. Plexo’s documentation indicates that if CVV is required, the callback’s instrument details will list "CVC" as a required field
plexo.gitbook.io
. You would then send the CVV value in the PaymentInstrumentInput (likely under a field for CVV; the exact JSON structure for sending CVV or similar is defined by Plexo’s API, e.g., an array of NonStorableItems or a map of field type to value).
In testing, CVV might not be enforced
plexo.gitbook.io
, but be prepared in production.
OptionalCommerceId: (Integer, optional) If your Client has multiple sub-merchants configured and no default set, specify which merchant ID to attribute this transaction to
plexo.gitbook.io
. If you have only one merchant and it’s set as default, you can omit this. (It’s good to ensure a default merchant is configured to simplify calls
plexo.gitbook.io
.)
OptionalInstrumentFields: (Optional) This is for special cases like recurring payments or 3-D Secure:
For recurring transactions, Plexo has a mechanism to handle initial and subsequent recurring charges (with fields RecurringPayment and Plan)
plexo.gitbook.io
plexo.gitbook.io
. If the project requires recurring billing, see Plexo’s notes on sending RecurringPayment=true on first charge and storing an ExtendedResponse plan ID for later uses
plexo.gitbook.io
plexo.gitbook.io
.
For 3DSecure, if you performed a prior 3DS authentication (see Section H), you would include the ThreeDSReferenceId here to tie the payment to that 3DS auth
plexo.gitbook.io
.
CybersourceDeviceFingerprint: (String, required for certain cards) If the chosen card is Visa or MasterCard processed by certain acquirers (Totalnet or OCA in Uruguay), Plexo requires a device fingerprint ID for fraud screening
plexo.gitbook.io
. This is a value you obtain by running a special script in the user’s context before calling Purchase. In web flows, you include a script from ThreatMetrix / CyberSource that generates a fingerprint ID
plexo.gitbook.io
plexo.gitbook.io
. For example, in a web page you’d embed:
html
Copy
Edit
<script src="https://h.online-metrix.net/fp/tags.js?org_id=45ssiuz3&session_id=visanetuy_px_1234TRX2157"></script>
where session_id is composed of your commerce ID and a unique transaction ID
plexo.gitbook.io
plexo.gitbook.io
. In a mobile app, you cannot run this JS easily; instead, you should contact Plexo support for how to generate or obtain a device fingerprint in a mobile context
plexo.gitbook.io
. It may involve calling a web service or using an SDK. If you skip the device fingerprint for Visa/MasterCard, transactions could be declined by the processor, so this is important for production. Use org_id=45ssiuz3 for test and 9ozphlqx for production as indicated
plexo.gitbook.io
.
Signing and Sending the Payment Request – Like the Authorization, the Purchase request must be signed with your private key. It will have a similar structure (Object.Fingerprint, inner Object with the Payment request data, UTCUnixTimeExpiration, and Signature). Use the same canonicalization and signing process
plexo.gitbook.io
. The endpoint for test would be .../Operation/Purchase on the testing URL (you can find the exact path in the WSDL or docs; from the GitBook it looks like the URL is /SecurePaymentGateway.svc/Operation/Purchase
plexo.gitbook.io
).
Processing the Response – Plexo will return a Transaction object in JSON if the request was received properly. Key parts of the response:
TransactionId: Plexo’s unique ID for this transaction (you might log this for reference)
plexo.gitbook.io
.
InstrumentToken: (Echoed back) The token used.
Amount, Currency, Installments: The charged amount details
plexo.gitbook.io
plexo.gitbook.io
.
Commerce: The merchant info used (ID and name)
plexo.gitbook.io
.
IsAnonymous: true/false depending on if the user was anonymous
plexo.gitbook.io
.
CurrentState / Status: This indicates the state of the transaction. Look at Transactions.Purchase.Status in the response:
For a credit card, a common successful flow might be Status 2 with TransactionResultText “Approved” (or similar) and TransactionCode 0
plexo.gitbook.io
.
If the method is asynchronous (like a bank transfer or cash payment code), Status might be 2 but TransactionResultText “Pending”
plexo.gitbook.io
, meaning the charge is initiated but not complete. You would then wait for a PaymentCallback (see below).
If an error occurred, Status could indicate failed and TransactionResultText will contain an error message, and TransactionCode might be non-zero.
Transactions.Purchase: Contains subfields like ClientReferenceId (echo), Status, TransactionCode, TransactionResultText, and ExecutionDateUTC
plexo.gitbook.io
.
FieldInformation: Extra data from the processor (e.g., authorization code, RRN, or for bank payments, info needed to complete payment)
plexo.gitbook.io
.
IsAsyncPayment: true/false – indicates if this payment is asynchronous (e.g., paying at a network or bank)
plexo.gitbook.io
.
UTCUnixTimeExpiration: If asynchronous, there might be an expiration for how long the payment link/code is valid
plexo.gitbook.io
.
Your backend should interpret this response:
If payment is approved (synchronous): you can consider the order paid and proceed to confirmation.
If payment is pending (async): you might mark the order as pending payment and wait for notification.
If failed: handle accordingly (perhaps allow retry or show error to user).
Handling Payment Callbacks (if applicable) – For asynchronous methods (like certain bank debits, offline cash payments, etc.), Plexo will not finalize the transaction immediately. In such cases, Plexo will send a PaymentCallback to your backend when the payment is completed or expires
plexo.gitbook.io
. This callback will contain an updated Transaction object with the final Status and Result (e.g., changed from “Pending” to “Approved” or “Expired”). Make sure your callback endpoint can handle this as well. Likely, Plexo uses the same callback URL for both instrument tokens and payment status callbacks, distinguished by the content of the JSON (a PaymentCallback will have a top-level Transaction object)
plexo.gitbook.io
plexo.gitbook.io
. You should:
Verify the signature of the callback.
Update the transaction status in your system (e.g., mark order as paid).
Respond with a ClientSignedResponse (Code 0) to acknowledge.
There’s no redirect for payment callbacks (those are server-to-server only).
If you are only accepting credit/debit cards that authorize in real-time, you may not encounter asynchronous flows. But it’s good to build your system to handle a “pending” state just in case (and to log any unexpected callbacks).
Post-Charge Actions – Once you have a successful charge, you can inform the mobile app of success. One approach: the app, after WebView closes, can poll an endpoint like GET /order/{id}/status which your backend populates after attempting the charge. Alternatively, you could have delayed the RedirectUri redirect until after charging. However, given Plexo’s flow, immediate redirect is built-in at token stage, so the user might return to the app before the charge API completes. It’s fine – just ensure the app shows a loading indicator “Processing payment…” until your backend confirms payment outcome via your API. Also, if you saved the token and the user opted to save their card, mark in your database that this user has an available payment token (so next time they can use saved card flow).
G. Managing Saved Cards and Future Payments
Token Storage and Reuse – Plexo’s platform is built to tokenize payment methods so they can be reused
plexo.gitbook.io
plexo.gitbook.io
. After a successful tokenization (the InstrumentToken from the callback), you can store that token on your side associated with the user’s profile. The token itself is typically a 32-character GUID-like string. It represents the card or account in Plexo’s vault. Storing tokens means returning customers can pay without re-entering full card details.
Using a Saved Token (Option 1: via Plexo Web) – The straightforward way to let users reuse a saved card is to still go through the Authorization and web form, but set it up to allow selecting existing instruments:
In the Authorization request, include the SelectInstrument flag in Action (bit 1) and not the RegisterInstrument flag if you don’t want to allow new entry, or both if you allow both
plexo.gitbook.io
. For example, Action:1 (just selection) or Action:3 (both select and add).
Plexo’s web form will then show the user’s saved cards (those tokens you kept) for them to pick, and/or an option to add a new one depending on the flags.
If the user picks a saved card, Plexo might still ask for the CVV if required by the processor (the form can display a CVV field for a selected card token if configured to do so).
The rest of the flow remains the same: Plexo will callback with the chosen token (which you already had, but now confirmed) and then you call Purchase. Note: If CVV was required, the token callback might include an indication that CVV was entered or needed; however, since the CVV is not stored, Plexo might directly use it for the subsequent payment authorization behind the scenes if the payment is done via ExpressCheckout. In a two-step approach, if you need CVV, better to gather it and send in Purchase.
This option is simpler from an implementation standpoint (no custom UI needed for card selection in the app), but it does present the user with a web view even for saved cards, which might be a slight UX hit.
Using a Saved Token (Option 2: Direct Charge) – If you want a more seamless one-click payment for returning users, you can skip showing the Plexo web form for saved cards:
You already have the token (and perhaps card last4 and brand to display to user). You can present the saved card in your app’s UI and let the user choose it.
When the user confirms, you directly call the Purchase operation (Step F) with that token, without calling Authorization. This is effectively charging the card on file.
Important considerations: If the card requires CVV for a non-web transaction, you need to collect CVV from the user in-app (perhaps via a secure input) and include it in the PaymentInstrumentInput as discussed
plexo.gitbook.io
. You must handle errors (e.g., token expired or not usable).
Also, if you do this entirely server-to-server, you lose the benefit of Plexo’s hosted form for that transaction. However, since the token is not sensitive, this is fine.
Make sure to still comply with any card scheme rules (some issuers require CVV for “card not present” recurring transactions unless 3DSecure is used).
Direct charging with a token is essentially how you’d implement “Express Checkout” in your app (the user just clicks “Pay $X with card ending 3450” and it’s done). It’s faster and keeps UX native, but you need to be confident in handling the needed data (CVV or 3DS if needed) within compliance.
ExpressCheckout Feature – Plexo version 4 introduced an official “ExpressCheckout” mode in their API
plexo.gitbook.io
plexo.gitbook.io
. This is a one-step combined operation:
You call Authorization with the ExpressCheckout flag (value 64) in the ActionType
plexo.gitbook.io
.
You include the purchase details (Items with name/description, etc.) in the Authorization/Purchase request.
The Plexo web page that loads will simultaneously allow method selection and perform the payment in one flow. It shows all available payment options on the left and the order summary on the right
plexo.gitbook.io
plexo.gitbook.io
.
The user completes it, and Plexo directly processes the payment without needing a separate Purchase call from your backend. You will get a PaymentCallback with the result when it’s done.
Notably, in ExpressCheckout, since the payment happens as part of the web flow, the InstrumentToken might not be separately returned (though it might if you choose to save it). Plexo notes that if no token is available (like a one-time use), you omit the InstrumentToken in the PaymentRequest and just send the rest
plexo.gitbook.io
.
ExpressCheckout is required for certain payment methods (they mention Banred, bank debit, credit request must use ExpressCheckout)
plexo.gitbook.io
. If your client plans to offer those, you’ll need to implement this flow.
For initial implementation with cards, you can stick to the two-step flow. ExpressCheckout could be an optimization or requirement down the line. It complicates the logic slightly (because you don’t control the payment call; Plexo does it when the user submits the form, and you rely on the PaymentCallback).
Managing Multiple Payment Instruments – If your app allows storing multiple cards, you can repeat the tokenization process for each new card (each yields a unique token and metadata). Plexo can show all saved instruments on the form if you use the selection interface. Alternatively, manage them in-app and use direct charges. Just be mindful to update tokens if a card expires or is removed – you might call a “DeleteInstrument” flag via the web interface or an API if needed (Plexo’s interface supports deletion if you include the DeleteInstrument flag in Authorization
plexo.gitbook.io
).
Token Expiration – Tokens for identified users (Type 0 sessions) do not expire by time, as long as the user is registered. However, if a token was created under an Anonymous session (Type 1), Plexo will auto-delete it after ~24 hours
plexo.gitbook.io
. In practice, you will use identified sessions for logged-in users, so their tokens remain until you or the user deletes them, or the underlying card is invalidated. It’s good to allow users to remove a saved card, which could simply mean dropping it from your database (the token will remain in Plexo but just unused) or calling Plexo’s delete instrument API if available.
H. Security Considerations (Signing, Verification, 3-D Secure)
Digital Signatures (Outbound Requests) – Every request your backend sends to Plexo must be properly signed with your certificate’s private key
plexo.gitbook.io
. This includes Authorization, Purchase, Cancel, Refund, etc. Reiterate that you should use a robust cryptographic method (RSA SHA-512). It’s wise to build a utility function or middleware in your Node app to handle Plexo request signing so that all calls include the signature and required fields. Test the signing with a simple call (Plexo recommends starting with a “Alta comercio” test which is simple, to ensure your signing is correct
plexo.gitbook.io
). If you get signature errors, refer to Plexo’s error message which shows the expected canonical string
plexo.gitbook.io
. Common pitfalls are missing default values for enums or including nulls – follow the canonicalization rules strictly
plexo.gitbook.io
plexo.gitbook.io
.
Signature Verification (Inbound Webhooks) – Plexo signs all callback payloads with their private key as well
plexo.gitbook.io
. You should verify these signatures using Plexo’s public key before trusting the data. Plexo provides an endpoint to retrieve their public key: SecurePaymentGateway.svc/Key
plexo.gitbook.io
 (the exact usage may be documented or you can ask support). Fetch this key (likely an RSA public key or certificate) and use it to verify the Signature on incoming messages. This ensures the callback wasn’t spoofed. Implementing verification is strongly recommended in production.
PCI Compliance and Sensitive Data – By using Plexo’s hosted fields, you offload the most sensitive parts. However, never log or store raw cardholder data that might accidentally come through. In our flow, you should never see PAN or CVV, only tokens and perhaps the last4 and card type which are fine to log. Keep the tokens secure – while they are not PANs, treat them as you would any auth token. They only work with your account, but if leaked, someone could attempt to use them if they also had your credentials.
3-D Secure Authentication (Optional) – Plexo supports 3-D Secure (3DS) for Visa/Mastercard, which can significantly reduce fraud and chargebacks
plexo.gitbook.io
plexo.gitbook.io
. It’s an optional step before charging the card:
If you want to use 3DS, Plexo offers a 3DS authentication service. You would call a 3DS endpoint with details like card token or card info to initiate the challenge
plexo.gitbook.io
plexo.gitbook.io
. The user would typically be redirected to their bank’s verification page (or an embedded iframe) to enter an OTP or password.
Once authenticated, you get a confirmation (perhaps an authentication ID or status). You then include the ThreeDSReferenceId in your subsequent Purchase request
plexo.gitbook.io
 so Plexo knows the transaction was authenticated.
Transactions with successful 3DS are marked as such and are typically safe from chargeback liability
plexo.gitbook.io
.
In a mobile context, 3DS can be tricky because it might involve showing another web view or using an SDK. If needed, coordinate with Plexo on how to implement 3DS in-app. Plexo’s documentation on 3DS is limited; they suggest contacting support for details on app integration
plexo.gitbook.io
.
If the client hasn’t mentioned 3DS, you might skip it initially. But be prepared: some acquirers or regions might mandate it or benefit from it. It’s wise to ask the client and Plexo if 3DS will be required for their card processing.
Fraud and Device Data – As mentioned in F.2, certain fraud prevention data like device fingerprint are required for Visa/MasterCard transactions via some processors
plexo.gitbook.io
plexo.gitbook.io
. Since our front-end is a mobile app, we cannot directly embed the JavaScript snippet that’s meant for web. Ask Plexo support for a mobile solution: they might provide a REST API to call in lieu of the JS, or advise to collect some device info. This is a critical step for production readiness with cards – skipping it could cause declines. Document whatever solution is provided and integrate it before going live.
Encryption and Transport – Ensure your backend uses up-to-date TLS when connecting to Plexo (their endpoints are HTTPS). Given it’s a .uy domain on port 4043, ensure no firewall is blocking that unusual port. The .PFX certificate might also be used for mutual TLS (client cert auth) when establishing the connection – but from docs it appears it’s primarily for signing, not necessarily for TLS client auth. Plexo’s statement “communication is encrypted end-to-end by public-private key system”
plexo.gitbook.io
 likely refers to their signing mechanism. Regular HTTPS is still in play. You likely don’t need to present the certificate at the TLS layer, only use it for signing.
I. Testing the Integration
Using the Sandbox – The Plexo testing environment (testing.plexo.com.uy) allows end-to-end testing without real charges. Use the sandbox PFX and ClientName provided by Plexo support for all your development and QA. All URLs and endpoints should point to the testing host. Verify that you can perform the full flow: authorization -> web form -> token callback -> purchase -> (if applicable, payment callback).
Test Cards and Scenarios – Ask Plexo for test card numbers or payment method data to use. Often payment gateways have specific test card numbers that simulate certain outcomes (approved, declined, 3DS required, etc.). Plexo’s documentation says to request “datos de prueba” (test data) from support for configuring payment methods
plexo.gitbook.io
. This could include:
Dummy card numbers (Visa, MasterCard) and associated expiration/CVV that will work in the test environment.
Possibly test credentials for alternative methods (e.g., a test bank account or a dummy cash payment code).
If none are provided, you might be able to use any syntactically valid card (e.g., Visa 4111111111111111) in test, but confirm with support.
Simulating User Flows – In sandbox, simulate various flows:
Successful payment with a new card.
Saving a card and using it again.
Entering a wrong card number or causing an error (Plexo should return an error code).
If possible, a 3DS challenge (maybe Plexo has a test page, or you skip since test might not trigger actual 3DS).
An asynchronous payment method (if your project will support, e.g., maybe a bank debit) to see the pending state and PaymentCallback behavior.
Cancellation: If a user drops off at the payment page, ensure your app times out or cancels gracefully. Since no token will come, maybe have a cancel button that closes the WebView and call a cancel API if needed (in test, you can call the Cancel operation for the session to see how it responds).
Inspecting Logs and Debugging – Log the requests and responses in test (excluding sensitive parts). This helps verify that the data you send is what Plexo expects. If Plexo returns a signature error, use the error message (they often include the expected string to sign
plexo.gitbook.io
) to adjust your signing code. Also log the ResultCode and TransactionResultText from responses to ensure you’re handling all outcomes. During development, you might use Plexo’s Anexo Técnico examples as a baseline to compare your JSON structures
plexo.gitbook.io
plexo.gitbook.io
.
User Acceptance Testing – Let the client run through the payment on a test build of the app connected to sandbox. They should experience the payment form and verify it meets their expectations (look & feel, language, etc.). Plexo’s form might be customizable in terms of logo or colors – ask Plexo or the client if any customization is available or needed.
Performance – The added web view and network calls introduce some latency (authorization call, then loading the web form, then payment call). In testing, measure these to ensure they are acceptable. Usually, the web form load is the longest part (a few seconds). If it’s too slow, check network or maybe ask Plexo if something can be optimized (e.g., loading only specific methods).
J. Deployment and Further Considerations
Go-Live Preparation – When moving to production, obtain the production ClientName and PFX certificate from Plexo (these will be different from test) and update your configuration securely. Switch the endpoint URLs to the production host (e.g., pagos.plexo.com.uy:4043). Do a small test transaction in production mode (perhaps with a low amount on a real card) to ensure everything works with the live systems. Plexo support may work with you to do a controlled test before fully enabling transactions.
Production Configuration – Make sure the client’s merchant account is fully set up in Plexo production. This includes all desired payment methods enabled and configured with correct merchant IDs, acquirer info, etc. (For example, if in test you only had Visa configured and now they want Mastercard and others, those need to be configured on their Plexo account). Coordinate with the client to get any required merchant account details to Plexo. Use the “Consulta de medios de pago habilitados” service to list what methods are configured for the client in prod, if needed
plexo.gitbook.io
plexo.gitbook.io
.
Webview on iOS vs Android – Since the app is React Native and iOS-first, ensure the WebView approach is working on iOS (likely using WKWebView under the hood). For Android, test the same flow early as well — Android’s WebView should also handle the redirect URI detection (you might need to use onShouldStartLoadWithRequest to intercept the custom scheme redirect on Android RN). There might be slight differences, e.g., Android might try to open an external browser for a custom scheme if not handled. Use RN Linking or WebView props to catch it.
Error Handling and User Messaging – Prepare to handle various error cases gracefully:
If the Authorization call fails (backend error or network issue), your app should show an error like “Unable to start payment. Please try again.”
If the user’s card is declined (Plexo Purchase returns an error code or callback with failure), ensure the app shows a meaningful message. The TransactionResultText from Plexo often contains a human-readable message like “Tarjeta rechazada” (card rejected) or error code
plexo.gitbook.io
plexo.gitbook.io
. You may want to map common codes to user-friendly messages.
If the callback doesn’t arrive within a timeout (network issues), have a fallback to query status or inform the user. Plexo’s status query API (Consultar estado) can be used to poll a transaction status by reference if needed
plexo.gitbook.io
plexo.gitbook.io
.
Refunds and Cancellations – Implement the ability to refund or cancel payments if the business needs it:
Use the Cancel (Cancelar una compra) operation to reverse a payment entirely
plexo.gitbook.io
. This is essentially a full refund. You need to specify which transaction to cancel using ReferenceType (e.g., by Plexo TransactionId or by your ClientReferenceId) and MetaReference (the actual ID value)
plexo.gitbook.io
plexo.gitbook.io
. Cancel only works on completed transactions and will return funds to the customer’s card. Partial cancellation is not supported via this endpoint
plexo.gitbook.io
.
Use the Refund (Devolución) operation for partial refunds if needed
plexo.gitbook.io
. Plexo introduced this for certain card types (Visa, Master, Diners, Lider)
plexo.gitbook.io
plexo.gitbook.io
. You provide the original transaction reference and an Amount (which must be <= original amount)
plexo.gitbook.io
. You can refund multiple times up to the original total (hence “Devoluciones múltiples” if more than one refund)
plexo.gitbook.io
. If the business expects refund capability, test this in sandbox and ensure you capture the refund TransactionResult.
Both Cancel and Refund calls need signing and will result in a response with success or error code. Log these and handle accordingly (e.g., update order status to refunded).
Only authorized staff or automated processes should trigger refunds/cancels, not typically the app user directly. But your backend should have these implemented for an admin interface or similar.
Monitoring and Logging – In production, maintain logs for all interactions with Plexo (perhaps with sensitive fields masked). This helps in troubleshooting issues with Plexo support. If a payment doesn’t go through, you can provide Plexo the TransactionId or timestamps to investigate. Also consider implementing alerts if callbacks fail or if repeated errors in signing occur, etc.
Support and Contingency – Establish a line of communication with Plexo support for any issues. Since Plexo is an intermediary to multiple payment providers, sometimes issues can occur downstream (e.g., an acquirer is down). The client should know how to reach Plexo support in such cases. Also, if some feature is not clearly documented (for example, mobile 3DS or device fingerprint generation), don’t hesitate to reach out to Plexo’s technical team for guidance
plexo.gitbook.io
. Document their guidance in your internal docs.
Follow-Up Questions for Client/Plexo – Based on the integration plan, here are some clarifications to confirm:
Payment Methods: Exactly which payment methods should be enabled for this app (just credit/debit cards, or also bank transfers, cash vouchers, etc.)? Ensure those are configured on Plexo and test each.
3-D Secure Requirement: Does the client’s acquiring bank mandate 3DS for transactions? If yes, plan the 3DS flow implementation with Plexo.
Branding of Payment Page: Can the Plexo payment page be customized with the client’s branding/logo? If so, have the client provide any required assets or styling instructions to Plexo.
Volume and Scaling: Expected transaction volume – ensure the approach can scale (the stateless nature of Plexo’s API and callbacks is fine for scaling; just ensure your server can handle concurrent callbacks and signing operations quickly).
Webhooks Verification: Will Plexo calls to our callback come from fixed IPs that we can whitelist? (If Plexo can provide IP ranges, you might add firewall rules. If not, rely on signature verification for security.)
Timeouts and Retries: Verify with Plexo how long an Authorization session stays valid (the ExpirationUTC tells you, often a few minutes) and what happens if the user is idle. Also, if your callback endpoint is down, does Plexo retry the callback? Knowing this helps in designing for reliability.
SDK Availability: Ask if Plexo has an official Node.js SDK or library (similar to their .NET SDK) to handle signing and requests. If not, you will proceed with custom implementation as above.
By following this guide and coordinating with the client and Plexo support on the open questions, you will implement a robust integration. The end result will be a seamless payment experience in the React Native app, with all sensitive operations securely handled on the backend through Plexo’s APIs
plexo.gitbook.io
plexo.gitbook.io
. Throughout the project, keep this document updated with any changes or insights gained during implementation, so the team has a single source of truth for the Plexo integration.