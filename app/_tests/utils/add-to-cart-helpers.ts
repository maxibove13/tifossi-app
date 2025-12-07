import { fireEvent, waitFor } from '@testing-library/react-native';
import { act } from 'react-test-renderer';

/**
 * Completes the add-to-cart flow including overlay interaction.
 * The overlay requires both size and quantity to show action buttons.
 * If the product has sizes pre-configured, the buttons should be visible.
 */
export async function completeAddToCartFlow(
  getByTestId: (testId: string) => any,
  getAllByText: (text: string | RegExp) => any[]
) {
  // 1. Press the main add-to-cart button (opens overlay)
  const addToCartButton = getByTestId('add-to-cart-button');
  await act(async () => {
    fireEvent.press(addToCartButton);
  });

  // 2. Wait for overlay to render with action buttons
  // The overlay shows 2 "Agregar al carrito" texts - one in header, one as button
  await waitFor(() => {
    const addToCartTexts = getAllByText('Agregar al carrito');
    expect(addToCartTexts.length).toBeGreaterThanOrEqual(2);
  });

  // 3. Press the overlay's add-to-cart button (the last one)
  const addToCartTexts = getAllByText('Agregar al carrito');
  const overlayButton = addToCartTexts[addToCartTexts.length - 1];

  // Find the touchable parent
  let pressable = overlayButton;
  while (pressable && typeof pressable.props?.onPress !== 'function') {
    pressable = pressable.parent;
  }

  await act(async () => {
    if (pressable?.props?.onPress) {
      pressable.props.onPress();
    } else {
      fireEvent.press(overlayButton);
    }
  });
}
