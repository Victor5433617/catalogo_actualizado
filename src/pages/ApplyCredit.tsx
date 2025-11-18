import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Upload } from "lucide-react";

export default function ApplyCredit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombreCompleto: "",
    numeroCedula: "",
    direccion: "",
    gastosMensuales: "",
    ingresoMensual: "",
    montoCredito: "",
    plazoMeses: "",
    referencia1Nombre: "",
    referencia1Telefono: "",
    referencia1Direccion: "",
    referencia2Nombre: "",
    referencia2Telefono: "",
    referencia2Direccion: "",
    gastosFamiliaresAproximado: "",
    gastosEnergia: "",
    gastosAlquiler: "",
    gastosCombustible: "",
    gastosInternet: "",
    cuotasBancariasCooperativas: "",
    ingresoVentasContribuyente: "",
  });

  const [files, setFiles] = useState({
    cedulaFront: null as File | null,
    cedulaBack: null as File | null,
    facturaAnde: null as File | null,
    certificadoTrabajo: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [field]: e.target.files[0] });
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from("credit-documents")
      .upload(path, file);

    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const timestamp = Date.now();
      const cedulaFrontPath = files.cedulaFront
        ? await uploadFile(files.cedulaFront, `cedula-front-${timestamp}-${files.cedulaFront.name}`)
        : null;
      const cedulaBackPath = files.cedulaBack
        ? await uploadFile(files.cedulaBack, `cedula-back-${timestamp}-${files.cedulaBack.name}`)
        : null;
      const facturaAndePath = files.facturaAnde
        ? await uploadFile(files.facturaAnde, `factura-ande-${timestamp}-${files.facturaAnde.name}`)
        : null;
      const certificadoTrabajoPath = files.certificadoTrabajo
        ? await uploadFile(files.certificadoTrabajo, `certificado-trabajo-${timestamp}-${files.certificadoTrabajo.name}`)
        : null;

      const { error } = await supabase.from("credit_applications").insert({
        nombre_completo: formData.nombreCompleto,
        numero_cedula: formData.numeroCedula,
        direccion: formData.direccion,
        gastos_mensuales: parseFloat(formData.gastosMensuales),
        ingreso_mensual: parseFloat(formData.ingresoMensual),
        monto_credito: parseFloat(formData.montoCredito),
        plazo_meses: parseInt(formData.plazoMeses),
        cedula_front_url: cedulaFrontPath,
        cedula_back_url: cedulaBackPath,
        factura_ande_url: facturaAndePath,
        certificado_trabajo_url: certificadoTrabajoPath,
        referencia_1_nombre: formData.referencia1Nombre,
        referencia_1_telefono: formData.referencia1Telefono,
        referencia_1_direccion: formData.referencia1Direccion,
        referencia_2_nombre: formData.referencia2Nombre,
        referencia_2_telefono: formData.referencia2Telefono,
        referencia_2_direccion: formData.referencia2Direccion,
        gastos_familiares_aproximado: parseFloat(formData.gastosFamiliaresAproximado),
        gastos_energia: parseFloat(formData.gastosEnergia),
        gastos_alquiler: parseFloat(formData.gastosAlquiler || "0"),
        gastos_combustible: parseFloat(formData.gastosCombustible || "0"),
        gastos_internet: parseFloat(formData.gastosInternet),
        cuotas_bancarias_cooperativas: formData.cuotasBancariasCooperativas || null,
        ingreso_ventas_contribuyente: formData.ingresoVentasContribuyente
          ? parseFloat(formData.ingresoVentasContribuyente)
          : null,
      });

      if (error) throw error;

      toast.success("Solicitud de crédito enviada exitosamente");
      navigate("/");
    } catch (error) {
      console.error("Error submitting credit application:", error);
      toast.error("Error al enviar la solicitud de crédito");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="max-w-3xl mx-auto bg-card p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-foreground">Solicitud de Crédito</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Información Personal</h2>
              
              <div>
                <Label htmlFor="nombreCompleto">Nombre Completo *</Label>
                <Input
                  id="nombreCompleto"
                  name="nombreCompleto"
                  value={formData.nombreCompleto}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="numeroCedula">Número de Cédula *</Label>
                <Input
                  id="numeroCedula"
                  name="numeroCedula"
                  value={formData.numeroCedula}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="direccion">Dirección *</Label>
                <Textarea
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Información Financiera</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ingresoMensual">Ingreso Mensual (Gs.) *</Label>
                  <Input
                    id="ingresoMensual"
                    name="ingresoMensual"
                    type="number"
                    value={formData.ingresoMensual}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="gastosMensuales">Gastos Mensuales (Gs.) *</Label>
                  <Input
                    id="gastosMensuales"
                    name="gastosMensuales"
                    type="number"
                    value={formData.gastosMensuales}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="montoCredito">Monto de Crédito Solicitado (Gs.) *</Label>
                  <Input
                    id="montoCredito"
                    name="montoCredito"
                    type="number"
                    value={formData.montoCredito}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="plazoMeses">Plazo (Meses) *</Label>
                  <Input
                    id="plazoMeses"
                    name="plazoMeses"
                    type="number"
                    value={formData.plazoMeses}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Detalle de Gastos</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gastosFamiliaresAproximado">Gastos Familiares Aproximados (Gs.) *</Label>
                  <Input
                    id="gastosFamiliaresAproximado"
                    name="gastosFamiliaresAproximado"
                    type="number"
                    value={formData.gastosFamiliaresAproximado}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="gastosEnergia">Gastos en Energía Eléctrica (Gs.) *</Label>
                  <Input
                    id="gastosEnergia"
                    name="gastosEnergia"
                    type="number"
                    value={formData.gastosEnergia}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="gastosAlquiler">Gastos en Alquiler (Gs.)</Label>
                  <Input
                    id="gastosAlquiler"
                    name="gastosAlquiler"
                    type="number"
                    value={formData.gastosAlquiler}
                    onChange={handleInputChange}
                    placeholder="0 si no tiene"
                  />
                </div>

                <div>
                  <Label htmlFor="gastosCombustible">Gastos en Combustible (Gs.)</Label>
                  <Input
                    id="gastosCombustible"
                    name="gastosCombustible"
                    type="number"
                    value={formData.gastosCombustible}
                    onChange={handleInputChange}
                    placeholder="0 si no tiene"
                  />
                </div>

                <div>
                  <Label htmlFor="gastosInternet">Gastos en Internet (Gs.) *</Label>
                  <Input
                    id="gastosInternet"
                    name="gastosInternet"
                    type="number"
                    value={formData.gastosInternet}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cuotasBancariasCooperativas">Cuotas Bancarias/Cooperativas (Nombre: Monto)</Label>
                <Textarea
                  id="cuotasBancariasCooperativas"
                  name="cuotasBancariasCooperativas"
                  value={formData.cuotasBancariasCooperativas}
                  onChange={handleInputChange}
                  placeholder="Ej: Banco Nacional: 500000, Cooperativa: 300000"
                />
              </div>

              <div>
                <Label htmlFor="ingresoVentasContribuyente">Ingreso de Ventas (si es contribuyente) (Gs.)</Label>
                <Input
                  id="ingresoVentasContribuyente"
                  name="ingresoVentasContribuyente"
                  type="number"
                  value={formData.ingresoVentasContribuyente}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Referencias Personales</h2>
              
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-medium">Primera Referencia *</h3>
                <div>
                  <Label htmlFor="referencia1Nombre">Nombre Completo</Label>
                  <Input
                    id="referencia1Nombre"
                    name="referencia1Nombre"
                    value={formData.referencia1Nombre}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="referencia1Telefono">Teléfono</Label>
                  <Input
                    id="referencia1Telefono"
                    name="referencia1Telefono"
                    value={formData.referencia1Telefono}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="referencia1Direccion">Dirección</Label>
                  <Textarea
                    id="referencia1Direccion"
                    name="referencia1Direccion"
                    value={formData.referencia1Direccion}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-medium">Segunda Referencia *</h3>
                <div>
                  <Label htmlFor="referencia2Nombre">Nombre Completo</Label>
                  <Input
                    id="referencia2Nombre"
                    name="referencia2Nombre"
                    value={formData.referencia2Nombre}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="referencia2Telefono">Teléfono</Label>
                  <Input
                    id="referencia2Telefono"
                    name="referencia2Telefono"
                    value={formData.referencia2Telefono}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="referencia2Direccion">Dirección</Label>
                  <Textarea
                    id="referencia2Direccion"
                    name="referencia2Direccion"
                    value={formData.referencia2Direccion}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Documentos Requeridos</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cedulaFront">Foto de Cédula (Frente) *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="cedulaFront"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "cedulaFront")}
                      required
                      className="flex-1"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cedulaBack">Foto de Cédula (Dorso) *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="cedulaBack"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "cedulaBack")}
                      required
                      className="flex-1"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="facturaAnde">Factura de ANDE *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="facturaAnde"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, "facturaAnde")}
                      required
                      className="flex-1"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="certificadoTrabajo">Certificado de Trabajo *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="certificadoTrabajo"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, "certificadoTrabajo")}
                      required
                      className="flex-1"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}