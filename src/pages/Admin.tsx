import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, Pencil, Trash2, Upload, Download, FileText } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryManager from "@/components/CategoryManager";
import { Switch } from "@/components/ui/switch";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  stock: number | null;
}

interface PartnerApplication {
  id: string;
  full_name: string;
  ande_bill_url: string | null;
  cedula_front_url: string | null;
  cedula_back_url: string | null;
  has_iva: boolean;
  iva_movements_url: string | null;
  tax_compliance_url: string | null;
  status: string;
  created_at: string;
}

interface CreditApplication {
  id: string;
  nombre_completo: string;
  numero_cedula: string;
  direccion: string;
  gastos_mensuales: number;
  ingreso_mensual: number;
  monto_credito: number;
  plazo_meses: number;
  cedula_front_url: string | null;
  cedula_back_url: string | null;
  factura_ande_url: string | null;
  certificado_trabajo_url: string | null;
  referencia_1_nombre: string;
  referencia_1_telefono: string;
  referencia_1_direccion: string;
  referencia_2_nombre: string;
  referencia_2_telefono: string;
  referencia_2_direccion: string;
  gastos_familiares_aproximado: number;
  gastos_energia: number;
  gastos_alquiler: number;
  gastos_combustible: number;
  gastos_internet: number;
  cuotas_bancarias_cooperativas: string | null;
  ingreso_ventas_contribuyente: number | null;
  status: string;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<PartnerApplication | null>(null);
  const [creditApplications, setCreditApplications] = useState<CreditApplication[]>([]);
  const [selectedCreditApp, setSelectedCreditApp] = useState<CreditApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "other",
    stock: "",
    image: null as File | null,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
        checkAdminRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos de administrador",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate("/auth");
      } else {
        fetchProducts();
        fetchCategories();
        fetchApplications();
        fetchCreditApplications();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
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

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes",
        variant: "destructive",
      });
    }
  };

  const fetchCreditApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCreditApplications(data || []);
    } catch (error: any) {
      console.error("Error fetching credit applications:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes de crédito",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = editingProduct?.image_url || null;

      if (formData.image) {
        imageUrl = await uploadImage(formData.image);
        if (!imageUrl) {
          setUploading(false);
          return;
        }
      }

      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category: formData.category as string | null,
        stock: formData.stock ? parseInt(formData.stock) : 0,
        image_url: imageUrl,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: "Producto actualizado exitosamente" });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        toast({ title: "Producto creado exitosamente" });
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Producto eliminado exitosamente" });
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleAvailability = async (productId: string, currentStock: number | null) => {
    try {
      // Toggle between 0 (not available) and 1 (available)
      const newStock = (currentStock === null || currentStock === 0) ? 1 : 0;
      
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);

      if (error) throw error;
      
      toast({ 
        title: "Estado actualizado",
        description: newStock > 0 ? "Producto marcado como disponible" : "Producto marcado como no disponible"
      });
      
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      category: product.category || "other",
      stock: product.stock?.toString() || "0",
      image: null,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "other",
      stock: "",
      image: null,
    });
  };


  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Panel de Administración</h1>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
            <TabsTrigger value="applications">Solicitudes de Socios</TabsTrigger>
            <TabsTrigger value="credits">Solicitudes de Crédito</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Gestión de Productos</CardTitle>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Producto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Precio *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stock">Stock</Label>
                        <Input
                          id="stock"
                          type="number"
                          min="0"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Categoría</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image">Imagen</Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                      />
                      {editingProduct?.image_url && !formData.image && (
                        <img src={editingProduct.image_url} alt="Preview" className="mt-2 h-32 object-cover rounded" />
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={uploading}>
                      {uploading ? "Guardando..." : (editingProduct ? "Actualizar" : "Crear")}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagen</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="h-12 w-12 object-cover rounded" />
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded flex items-center justify-center text-xs">
                          Sin img
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{categories.find(c => c.id === product.category)?.name || '-'}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={product.stock !== null && product.stock > 0}
                          onCheckedChange={() => toggleAvailability(product.id, product.stock)}
                        />
                        <span className={`text-xs font-medium ${product.stock !== null && product.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {product.stock !== null && product.stock > 0 ? 'Disponible' : 'No disponible'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {products.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay productos. Crea uno para comenzar.
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManager />
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes de Socios</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tiene IVA</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.full_name}</TableCell>
                        <TableCell>{app.has_iva ? "Sí" : "No"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            app.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                            app.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {app.status === 'pending' ? 'Pendiente' : app.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(app);
                              setApplicationDialogOpen(true);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {applications.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay solicitudes pendientes.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credits">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes de Crédito</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cédula</TableHead>
                      <TableHead>Monto Solicitado</TableHead>
                      <TableHead>Plazo (meses)</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>{app.nombre_completo}</TableCell>
                        <TableCell>{app.numero_cedula}</TableCell>
                        <TableCell>₲ {app.monto_credito.toLocaleString()}</TableCell>
                        <TableCell>{app.plazo_meses}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            app.status === 'approved' ? 'bg-green-100 text-green-800' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {app.status === 'pending' ? 'Pendiente' : 
                             app.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCreditApp(app);
                              setCreditDialogOpen(true);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Application Details Dialog */}
        <Dialog open={applicationDialogOpen} onOpenChange={setApplicationDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de Solicitud - {selectedApplication?.full_name}</DialogTitle>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre Completo</Label>
                    <p className="text-sm font-medium mt-1">{selectedApplication.full_name}</p>
                  </div>
                  <div>
                    <Label>Tiene IVA</Label>
                    <p className="text-sm font-medium mt-1">{selectedApplication.has_iva ? "Sí" : "No"}</p>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <p className="text-sm font-medium mt-1">{selectedApplication.status}</p>
                  </div>
                  <div>
                    <Label>Fecha de Solicitud</Label>
                    <p className="text-sm font-medium mt-1">{new Date(selectedApplication.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Documentos Adjuntos</h3>
                  <div className="space-y-3">
                    {selectedApplication.ande_bill_url && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Factura de ANDE</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const { data } = await supabase.storage
                              .from("partner-documents")
                              .download(selectedApplication.ande_bill_url!);
                            if (data) {
                              const url = URL.createObjectURL(data);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `ande_${selectedApplication.full_name}`;
                              a.click();
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    )}
                    {selectedApplication.cedula_front_url && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Cédula (Frente)</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const { data } = await supabase.storage
                              .from("partner-documents")
                              .download(selectedApplication.cedula_front_url!);
                            if (data) {
                              const url = URL.createObjectURL(data);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `cedula_front_${selectedApplication.full_name}`;
                              a.click();
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    )}
                    {selectedApplication.cedula_back_url && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Cédula (Reverso)</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const { data } = await supabase.storage
                              .from("partner-documents")
                              .download(selectedApplication.cedula_back_url!);
                            if (data) {
                              const url = URL.createObjectURL(data);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `cedula_back_${selectedApplication.full_name}`;
                              a.click();
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    )}
                    {selectedApplication.has_iva && selectedApplication.iva_movements_url && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Movimiento de IVA</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const { data } = await supabase.storage
                              .from("partner-documents")
                              .download(selectedApplication.iva_movements_url!);
                            if (data) {
                              const url = URL.createObjectURL(data);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `iva_movements_${selectedApplication.full_name}`;
                              a.click();
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    )}
                    {selectedApplication.has_iva && selectedApplication.tax_compliance_url && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Constancia de Cumplimiento Tributario</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const { data } = await supabase.storage
                              .from("partner-documents")
                              .download(selectedApplication.tax_compliance_url!);
                            if (data) {
                              const url = URL.createObjectURL(data);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `tax_compliance_${selectedApplication.full_name}`;
                              a.click();
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Credit Application Details Dialog */}
        <Dialog open={creditDialogOpen} onOpenChange={(open) => {
          if (!open) setSelectedCreditApp(null);
          setCreditDialogOpen(open);
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de Solicitud de Crédito - {selectedCreditApp?.nombre_completo}</DialogTitle>
            </DialogHeader>
            {selectedCreditApp && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre Completo</Label>
                    <p className="text-sm font-medium mt-1">{selectedCreditApp.nombre_completo}</p>
                  </div>
                  <div>
                    <Label>Número de Cédula</Label>
                    <p className="text-sm font-medium mt-1">{selectedCreditApp.numero_cedula}</p>
                  </div>
                  <div>
                    <Label>Dirección</Label>
                    <p className="text-sm font-medium mt-1">{selectedCreditApp.direccion}</p>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <p className="text-sm font-medium mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedCreditApp.status === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedCreditApp.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedCreditApp.status === 'pending' ? 'Pendiente' : 
                         selectedCreditApp.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Información Financiera</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Monto del Crédito</Label>
                      <p className="text-sm font-medium mt-1">₲ {selectedCreditApp.monto_credito.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Plazo</Label>
                      <p className="text-sm font-medium mt-1">{selectedCreditApp.plazo_meses} meses</p>
                    </div>
                    <div>
                      <Label>Ingreso Mensual</Label>
                      <p className="text-sm font-medium mt-1">₲ {selectedCreditApp.ingreso_mensual.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Gastos Mensuales</Label>
                      <p className="text-sm font-medium mt-1">₲ {selectedCreditApp.gastos_mensuales.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Detalle de Gastos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Gastos Familiares</Label>
                      <p className="text-sm font-medium mt-1">₲ {selectedCreditApp.gastos_familiares_aproximado.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Energía Eléctrica</Label>
                      <p className="text-sm font-medium mt-1">₲ {selectedCreditApp.gastos_energia.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Alquiler</Label>
                      <p className="text-sm font-medium mt-1">₲ {selectedCreditApp.gastos_alquiler.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Combustible</Label>
                      <p className="text-sm font-medium mt-1">₲ {selectedCreditApp.gastos_combustible.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Internet</Label>
                      <p className="text-sm font-medium mt-1">₲ {selectedCreditApp.gastos_internet.toLocaleString()}</p>
                    </div>
                    {selectedCreditApp.cuotas_bancarias_cooperativas && (
                      <div>
                        <Label>Cuotas Bancarias/Cooperativas</Label>
                        <p className="text-sm font-medium mt-1">{selectedCreditApp.cuotas_bancarias_cooperativas}</p>
                      </div>
                    )}
                    {selectedCreditApp.ingreso_ventas_contribuyente && (
                      <div>
                        <Label>Ingreso Ventas (Contribuyente)</Label>
                        <p className="text-sm font-medium mt-1">₲ {selectedCreditApp.ingreso_ventas_contribuyente.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Referencias</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base">Referencia 1</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Nombre</Label>
                          <p className="text-sm font-medium">{selectedCreditApp.referencia_1_nombre}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Teléfono</Label>
                          <p className="text-sm font-medium">{selectedCreditApp.referencia_1_telefono}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Dirección</Label>
                          <p className="text-sm font-medium">{selectedCreditApp.referencia_1_direccion}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-base">Referencia 2</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Nombre</Label>
                          <p className="text-sm font-medium">{selectedCreditApp.referencia_2_nombre}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Teléfono</Label>
                          <p className="text-sm font-medium">{selectedCreditApp.referencia_2_telefono}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Dirección</Label>
                          <p className="text-sm font-medium">{selectedCreditApp.referencia_2_direccion}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Documentos Adjuntos</h3>
                  <div className="space-y-3">
                    {selectedCreditApp.cedula_front_url && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Cédula (Frente)</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const { data } = await supabase.storage
                              .from("credit-documents")
                              .download(selectedCreditApp.cedula_front_url!);
                            if (data) {
                              const url = URL.createObjectURL(data);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `cedula_front_${selectedCreditApp.nombre_completo}`;
                              a.click();
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    )}
                    {selectedCreditApp.cedula_back_url && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Cédula (Reverso)</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const { data } = await supabase.storage
                              .from("credit-documents")
                              .download(selectedCreditApp.cedula_back_url!);
                            if (data) {
                              const url = URL.createObjectURL(data);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `cedula_back_${selectedCreditApp.nombre_completo}`;
                              a.click();
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    )}
                    {selectedCreditApp.factura_ande_url && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Factura de ANDE</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const { data } = await supabase.storage
                              .from("credit-documents")
                              .download(selectedCreditApp.factura_ande_url!);
                            if (data) {
                              const url = URL.createObjectURL(data);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `factura_ande_${selectedCreditApp.nombre_completo}`;
                              a.click();
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    )}
                    {selectedCreditApp.certificado_trabajo_url && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Certificado de Trabajo</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const { data } = await supabase.storage
                              .from("credit-documents")
                              .download(selectedCreditApp.certificado_trabajo_url!);
                            if (data) {
                              const url = URL.createObjectURL(data);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `certificado_trabajo_${selectedCreditApp.nombre_completo}`;
                              a.click();
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label>Fecha de Solicitud</Label>
                  <p className="text-sm font-medium mt-1">{new Date(selectedCreditApp.created_at).toLocaleString()}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
