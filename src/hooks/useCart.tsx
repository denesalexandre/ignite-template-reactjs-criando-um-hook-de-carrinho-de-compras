import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {

    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const newCart = [...cart];
      let product: Product = {} as Product;

      newCart.forEach((item) => {
        if (item.id === productId) {
          product = item;
          return;
        }
      });

      if (Object.keys(product).length === 0) {
        const response = await api.get(`products/${productId}`);
        const newProduct = {
          ...response.data,
          amount: 1
        }

        newCart.push(newProduct);
      } else {
        const newAmount = product.amount + 1;
        const hasStock = await checkStock(productId, newAmount);

        if (hasStock) {
          product.amount = newAmount;
        } else {
          throw new Error("Erro na adição do produto");
        }
      }

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      // TODO
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const newCart = cart.filter((item) => item.id !== productId);

      if (newCart.length === cart.length) {
        throw new Error("Erro na remoção do produto");
      }

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount <= 0) return false;

      let product = {} as Product;
      const newCart = cart.map(item => {
        if (item.id === productId) {
          product = item
        }
        return item;
      });

      const hasStock = await checkStock(product.id, amount);
      if (hasStock) {
        product.amount = amount
      } else {
        return false;
      }

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  const checkStock = async (productId: number, amount: number) => {
    const response = await api.get(`stock/${productId}`);
    const stock: Stock = response.data;

    if (amount > stock.amount) {
      toast.error("Quantidade solicitada fora de estoque");
      return false;
    }

    return true;
  }


  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
