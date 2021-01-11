import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import formatValue from '../utils/formatValue';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  cartTotal: string;
  totalItemsInCart: number;
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartTotal, setCartTotal] = useState('R$0,00');
  const [totalItemsInCart, setTotalItemsInCart] = useState(0);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    }

    loadProducts();
  }, []);

  const saveStorage = async (updatedProducts: Product[]): Promise<void> => {
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(updatedProducts),
    );
  };

  const addToCart = useCallback(
    async product => {
      const index = products.findIndex(({ id }) => product.id === id);

      let updatedProducts = [] as Product[];

      if (index < 0) {
        updatedProducts = [...products, { ...product, quantity: 1 }];
      } else {
        updatedProducts = products.map((mappedProduct, findIndex) => {
          if (index !== findIndex) return mappedProduct;

          return { ...mappedProduct, quantity: mappedProduct.quantity + 1 };
        });
      }
      saveStorage(updatedProducts);

      return setProducts(updatedProducts);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedProducts = products.map(product => {
        if (product.id !== id) return product;

        return { ...product, quantity: product.quantity + 1 };
      });

      saveStorage(updatedProducts);

      return setProducts(updatedProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedProducts = products.map(product => {
        if (product.id !== id) return product;

        const newQuantity = product.quantity - 1;
        return { ...product, quantity: newQuantity > 0 ? newQuantity : 0 };
      });

      saveStorage(updatedProducts.filter(({ quantity }) => quantity > 0));

      return setProducts(updatedProducts);
    },
    [products],
  );

  useMemo(() => {
    const total = products.reduce((accumulator, product) => {
      return accumulator + product.price * product.quantity;
    }, 0);

    setCartTotal(formatValue(total));
  }, [products]);

  useMemo(() => {
    const totalItems = products.reduce((accumulator, product) => {
      return accumulator + product.quantity;
    }, 0);

    setTotalItemsInCart(totalItems);
  }, [products]);

  const value = React.useMemo(
    () => ({
      addToCart,
      increment,
      decrement,
      products,
      cartTotal,
      totalItemsInCart,
    }),
    [products, addToCart, increment, decrement, cartTotal, totalItemsInCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
