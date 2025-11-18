import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import backgroundImage from "@/assets/background-store.jpg";
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  stock: number | null;
}
const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchProducts();
    fetchCategories();

    // Realtime subscription
    const channel = supabase.channel('products-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'products'
    }, () => {
      fetchProducts();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);
  const fetchProducts = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('products').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];
    if (searchTerm) {
      filtered = filtered.filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    setFilteredProducts(filtered);
  };
  return <div className="min-h-screen bg-background relative">
      {/* Background Image with Transparency */}
      <div 
        className="fixed inset-0 z-0 opacity-15"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Content Layer */}
      <div className="relative z-10">
        <Navbar />
      
      {/* Hero Section */}
      <section style={{
      background: 'var(--gradient-hero)'
    }} className="pt-24 pb-12 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4 animate-in fade-in slide-in-from-bottom duration-700">
            Nuestro Catálogo
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom duration-700 delay-150">
            Descubre nuestra selección de productos de calidad
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 px-4 border-b">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Buscar productos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          {loading ? <div className="text-center text-muted-foreground">Cargando productos...</div> : filteredProducts.length === 0 ? <div className="text-center text-muted-foreground">
              {products.length === 0 ? "No hay productos disponibles aún" : "No se encontraron productos con los filtros seleccionados"}
            </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => <ProductCard key={product.id} id={product.id} name={product.name} description={product.description || undefined} price={product.price} image_url={product.image_url || undefined} category={product.category || undefined} stock={product.stock || undefined} />)}
            </div>}
        </div>
      </section>
      </div>

      {/* WhatsApp Floating Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <Button
          onClick={() => window.open('https://wa.me/595983860064', '_blank')}
          className="bg-[#25D366] hover:bg-[#20BA5A] text-white shadow-lg rounded-full w-14 h-14 p-0 flex items-center justify-center transition-transform hover:scale-110"
          title="WhatsApp: 0983860064"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </Button>
        <Button
          onClick={() => window.open('https://wa.me/595973122827', '_blank')}
          className="bg-[#25D366] hover:bg-[#20BA5A] text-white shadow-lg rounded-full w-14 h-14 p-0 flex items-center justify-center transition-transform hover:scale-110"
          title="WhatsApp: 0973122827"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </Button>
        <Button
          onClick={() => window.open('https://wa.me/595983860065', '_blank')}
          className="bg-[#25D366] hover:bg-[#20BA5A] text-white shadow-lg rounded-full w-14 h-14 p-0 flex items-center justify-center transition-transform hover:scale-110"
          title="WhatsApp: 0983860065"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </Button>
      </div>
    </div>;
};
export default Index;