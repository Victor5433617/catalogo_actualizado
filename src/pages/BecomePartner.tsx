import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const BecomePartner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    hasIva: false,
  });
  const [files, setFiles] = useState<{
    andeBill: File | null;
    cedulaFront: File | null;
    cedulaBack: File | null;
    ivaMovements: File | null;
    taxCompliance: File | null;
  }>({
    andeBill: null,
    cedulaFront: null,
    cedulaBack: null,
    ivaMovements: null,
    taxCompliance: null,
  });

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from("partner-documents")
      .upload(path, file);

    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar campos requeridos
      if (!formData.fullName || !files.andeBill || !files.cedulaFront || !files.cedulaBack) {
        toast({
          variant: "destructive",
          title: "Campos requeridos",
          description: "Por favor complete todos los campos obligatorios",
        });
        setLoading(false);
        return;
      }

      if (formData.hasIva && (!files.ivaMovements || !files.taxCompliance)) {
        toast({
          variant: "destructive",
          title: "Documentos IVA requeridos",
          description: "Si tiene IVA, debe cargar los documentos correspondientes",
        });
        setLoading(false);
        return;
      }

      const timestamp = Date.now();
      const sanitizedName = formData.fullName.replace(/[^a-zA-Z0-9]/g, "_");

      // Subir archivos
      const andeBillPath = await uploadFile(
        files.andeBill,
        `${timestamp}_${sanitizedName}_ande.${files.andeBill.name.split(".").pop()}`
      );
      const cedulaFrontPath = await uploadFile(
        files.cedulaFront,
        `${timestamp}_${sanitizedName}_cedula_front.${files.cedulaFront.name.split(".").pop()}`
      );
      const cedulaBackPath = await uploadFile(
        files.cedulaBack,
        `${timestamp}_${sanitizedName}_cedula_back.${files.cedulaBack.name.split(".").pop()}`
      );

      let ivaMovementsPath = null;
      let taxCompliancePath = null;

      if (formData.hasIva && files.ivaMovements && files.taxCompliance) {
        ivaMovementsPath = await uploadFile(
          files.ivaMovements,
          `${timestamp}_${sanitizedName}_iva.${files.ivaMovements.name.split(".").pop()}`
        );
        taxCompliancePath = await uploadFile(
          files.taxCompliance,
          `${timestamp}_${sanitizedName}_tax.${files.taxCompliance.name.split(".").pop()}`
        );
      }

      // Guardar en la base de datos
      const { error: dbError } = await supabase
        .from("partner_applications")
        .insert({
          full_name: formData.fullName,
          ande_bill_url: andeBillPath,
          cedula_front_url: cedulaFrontPath,
          cedula_back_url: cedulaBackPath,
          has_iva: formData.hasIva,
          iva_movements_url: ivaMovementsPath,
          tax_compliance_url: taxCompliancePath,
        });

      if (dbError) throw dbError;

      toast({
        title: "Solicitud enviada",
        description: "Su solicitud ha sido enviada exitosamente. Nos pondremos en contacto pronto.",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Hubo un error al enviar su solicitud",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-2 text-center">Quiero ser Socio</h1>
        <p className="text-muted-foreground text-center mb-8">
          Complete el siguiente formulario para solicitar ser socio
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg shadow-lg">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre y Apellido *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ingrese su nombre completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="andeBill">Factura de ANDE *</Label>
            <Input
              id="andeBill"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFiles({ ...files, andeBill: e.target.files?.[0] || null })}
              required
            />
            <p className="text-xs text-muted-foreground">Formatos: imagen o PDF</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cedulaFront">Cédula (Frente) *</Label>
            <Input
              id="cedulaFront"
              type="file"
              accept="image/*"
              onChange={(e) => setFiles({ ...files, cedulaFront: e.target.files?.[0] || null })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cedulaBack">Cédula (Reverso) *</Label>
            <Input
              id="cedulaBack"
              type="file"
              accept="image/*"
              onChange={(e) => setFiles({ ...files, cedulaBack: e.target.files?.[0] || null })}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasIva"
              checked={formData.hasIva}
              onCheckedChange={(checked) => setFormData({ ...formData, hasIva: checked as boolean })}
            />
            <Label htmlFor="hasIva" className="cursor-pointer">
              Tengo IVA
            </Label>
          </div>

          {formData.hasIva && (
            <>
              <div className="space-y-2">
                <Label htmlFor="ivaMovements">Movimiento de IVA (últimos 6 meses) *</Label>
                <Input
                  id="ivaMovements"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setFiles({ ...files, ivaMovements: e.target.files?.[0] || null })}
                  required={formData.hasIva}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxCompliance">Constancia de Cumplimiento Tributario *</Label>
                <Input
                  id="taxCompliance"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setFiles({ ...files, taxCompliance: e.target.files?.[0] || null })}
                  required={formData.hasIva}
                />
              </div>
            </>
          )}

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate("/")} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Solicitud"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BecomePartner;
