import { fireEvent, waitFor } from '@testing-library/react-native';
import { act } from 'react-test-renderer';

/**
 * Completes the add-to-cart flow including overlay interaction.
 * The overlay requires explicit user selection of both size AND quantity
 * before action buttons become visible.
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

  // 2. Wait for overlay to render with "Seleccionar" options
  await waitFor(() => {
    const selectTexts = getAllByText('Seleccionar');
    expect(selectTexts.length).toBeGreaterThanOrEqual(2); // Size and Quantity rows
  });

  // 3. Explicitly select size - press "Talle" row, then save
  const talleRow = getAllByText('Talle')[0];
  let tallePressable = talleRow;
  while (tallePressable && typeof tallePressable.props?.onPress !== 'function') {
    tallePressable = tallePressable.parent;
  }
  await act(async () => {
    if (tallePressable?.props?.onPress) {
      tallePressable.props.onPress();
    }
  });

  // Wait for size overlay and press "Guardar"
  await waitFor(() => {
    expect(getAllByText('Guardar').length).toBeGreaterThan(0);
  });
  const sizeGuardarButtons = getAllByText('Guardar');
  let sizeGuardar = sizeGuardarButtons[0];
  while (sizeGuardar && typeof sizeGuardar.props?.onPress !== 'function') {
    sizeGuardar = sizeGuardar.parent;
  }
  await act(async () => {
    if (sizeGuardar?.props?.onPress) {
      sizeGuardar.props.onPress();
    }
  });

  // 4. Explicitly select quantity - press "Cantidad" row, then save
  await waitFor(() => {
    expect(getAllByText('Cantidad').length).toBeGreaterThan(0);
  });
  const cantidadRow = getAllByText('Cantidad')[0];
  let cantidadPressable = cantidadRow;
  while (cantidadPressable && typeof cantidadPressable.props?.onPress !== 'function') {
    cantidadPressable = cantidadPressable.parent;
  }
  await act(async () => {
    if (cantidadPressable?.props?.onPress) {
      cantidadPressable.props.onPress();
    }
  });

  // Wait for quantity overlay and press "Guardar"
  await waitFor(() => {
    expect(getAllByText('Guardar').length).toBeGreaterThan(0);
  });
  const qtyGuardarButtons = getAllByText('Guardar');
  let qtyGuardar = qtyGuardarButtons[0];
  while (qtyGuardar && typeof qtyGuardar.props?.onPress !== 'function') {
    qtyGuardar = qtyGuardar.parent;
  }
  await act(async () => {
    if (qtyGuardar?.props?.onPress) {
      qtyGuardar.props.onPress();
    }
  });

  // 5. Now action buttons should be visible - wait for "Agregar al carrito" button
  await waitFor(() => {
    const addToCartTexts = getAllByText('Agregar al carrito');
    expect(addToCartTexts.length).toBeGreaterThanOrEqual(2); // Header + button
  });

  // 6. Press the overlay's add-to-cart button (the last one)
  const addToCartTexts = getAllByText('Agregar al carrito');
  const overlayButton = addToCartTexts[addToCartTexts.length - 1];

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
