import React, { useState, createContext, useContext } from "react";
import { useSupabaseQuery } from "@/hooks/useSupabaseData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ShoppingBag, Plus, Minus, Trash, X } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// Simple local cart hook/state simulation for ease of use
export default function CustomerMarketplace() {
  const { data: inventory = [], loading } = useSupabaseQuery<any>("inventory");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filter only items listed in marketplace or fallback to all items for preview
  const products = inventory.filter((item: any) => item.is_marketplace_listed || true);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        toast.success(`Increased quantity of ${product.name}`);
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      toast.success(`Added ${product.name} to cart`);
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.sell_price || 0,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    toast.error("Removed item from cart");
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-primary animate-pulse" /> Device Marketplace
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Browse and purchase accessories, spare parts, and refurbished devices
          </p>
        </div>
        <Button
          onClick={() => setIsCartOpen(true)}
          className="rounded-xl font-bold gap-2 relative shadow-lg shadow-primary/20"
        >
          <ShoppingCart className="h-5 w-5" /> Cart
          {cart.length > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full text-[10px] font-black">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </Badge>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[280px] bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground font-medium">No items currently listed for sale.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product: any) => (
            <Card
              key={product.id}
              className="border border-white/10 shadow-lg bg-card/50 backdrop-blur rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform flex flex-col justify-between"
            >
              <CardHeader className="p-0 relative h-40 bg-muted/20 flex items-center justify-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                {product.quantity <= 0 && (
                  <Badge variant="destructive" className="absolute top-3 right-3 font-bold">
                    Out of Stock
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">{product.name}</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-1 line-clamp-2">
                    {product.description || "Premium quality part / accessory."}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black tracking-tight">
                    ₹{product.sell_price || 0}
                  </span>
                  <Button
                    onClick={() => addToCart(product)}
                    disabled={product.quantity <= 0}
                    size="sm"
                    className="rounded-xl font-bold"
                  >
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Slide-out Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-background h-full shadow-2xl p-6 flex flex-col justify-between animate-slide-in relative">
            <button
              onClick={() => setIsCartOpen(false)}
              className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 mt-4">
                <ShoppingCart className="h-6 w-6 text-primary" /> Your Cart
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground font-medium">Your cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border border-white/5 bg-muted/20 rounded-xl"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-bold text-sm truncate">{item.name}</p>
                        <p className="text-xs text-primary font-black mt-0.5">₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 border border-white/10 bg-background/50 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:text-primary"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:text-primary"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-muted-foreground hover:text-rose-500 transition-colors"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-white/10 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-muted-foreground">Total:</span>
                  <span className="text-2xl font-black text-primary">₹{cartTotal}</span>
                </div>
                <Button
                  onClick={() => {
                    toast.success("Checkout successful! Order placed.");
                    setCart([]);
                    setIsCartOpen(false);
                  }}
                  className="w-full rounded-xl font-bold py-3 text-base"
                >
                  Place Order
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
