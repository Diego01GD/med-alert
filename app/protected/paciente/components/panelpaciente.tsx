"use client";

import { useState, useEffect } from "react";

// Opciones fijas para tus dropdowns del diseño
const MOTIVOS_OMISION = [
  "Olvidé tomarlo",
  "Me causó malestar estresante",
  "No tenía el medicamento disponible",
  "Se me pasó la hora por el trabajo/estudio",
  "El sabor es muy desagradable",
  "Otro",
];

const EFECTOS_ADVERSOS = [
  "Ninguno",
  "Náuseas o vómito",
  "Dolor de cabeza severo",
  "Mareos o somnolencia",
  "Dolor estomacal / Diarrea",
  "Otro",
];

// Definimos las propiedades que va a recibir desde el servidor (Supabase)
interface PanelPacienteProps {
  datosIniciales?: Array<{
    id: string;
    medicamento: string;
    dosis: string;
    frecuencia: string;
    horaProgramada: string;
    estado: string;
  }>;
}

export default function PanelPaciente({ datosIniciales = [] }: PanelPacienteProps) {
  // 1. Inicializamos el estado con los datos reales blindados contra undefined o vacíos
  const [dosisDelDia, setDosisDelDia] = useState(
    datosIniciales && datosIniciales.length > 0 ? datosIniciales : []
  );
  const [mostrarModalNoCumplido, setMostrarModalNoCumplido] = useState(false);
  
  // 2. Protección por si el arreglo viene vacío desde la base de datos
  const [dosisSeleccionada, setDosisSeleccionada] = useState<any>(
    datosIniciales && datosIniciales.length > 0 ? datosIniciales[0] : null
  );
  
  // Estados del Formulario del Modal
  const [motivoSeleccionado, setMotivoSeleccionado] = useState("");
  const [efectoSeleccionado, setEfectoSeleccionado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const MAX_CARACTERES = 150;

  // Estado para el Banner Superior Dinámico (Reloj)
  const [alertaSuperior, setAlertaSuperior] = useState({
    color: "sky",
    titulo: "Cargando próximas tomas...",
    mensaje: "Sincronizando el reloj de MedAlert.",
    icono: "⏳"
  });

  // Función para convertir la hora programada a minutos totales del día
  const stringAMinutos = (horaStr: string) => {
    if (!horaStr) return 0;
    const [tiempo, formato] = horaStr.split(" ");
    let [horas, minutos] = tiempo.split(":").map(Number);
    if (formato === "PM" && horas !== 12) horas += 12;
    if (formato === "AM" && horas === 12) horas = 0;
    return horas * 60 + minutos;
  };

  // Lógica del Reloj en Tiempo Real para calcular los banners de alerta
  useEffect(() => {
    if (dosisDelDia.length === 0) {
      setAlertaSuperior({
        color: "sky",
        titulo: "Sin medicamentos",
        mensaje: "No tienes tratamientos asignados para hoy.",
        icono: "📅"
      });
      return;
    }

    const evaluarAlertasYHorarios = () => {
      const ahora = new Date();
      const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
      const dosisPendientes = dosisDelDia.filter(d => d.estado === "pendiente");
      
      if (dosisPendientes.length === 0) {
        setAlertaSuperior({
          color: "sky",
          titulo: "¡Todo al corriente!",
          mensaje: "Has completado o reportado tus tomas programadas de hoy.",
          icono: "🎉"
        });
        return;
      }

      const proximaDosis = dosisPendientes.sort((a, b) => 
        stringAMinutos(a.horaProgramada) - stringAMinutos(b.horaProgramada)
      )[0];

      const minProgramados = stringAMinutos(proximaDosis.horaProgramada);
      const diferencia = minProgramados - minutosActuales; 

      if (diferencia > 15) {
        setAlertaSuperior({
          color: "sky",
          titulo: "Próxima toma programada",
          mensaje: `Tu siguiente medicamento es ${proximaDosis.medicamento} a las ${proximaDosis.horaProgramada}`,
          icono: "ℹ️"
        });
      } else if (diferencia >= -10 && diferencia <= 15) {
        setAlertaSuperior({
          color: "orange",
          titulo: "Aviso: tu toma se aproxima o está en hora",
          mensaje: `Es momento de tomar tu ${proximaDosis.medicamento} de las ${proximaDosis.horaProgramada}`,
          icono: "🔔"
        });
      } else if (diferencia < -10) {
        setAlertaSuperior({
          color: "red",
          titulo: "Dosis retrasada",
          mensaje: `Se ha excedido el tiempo de tolerancia para tu ${proximaDosis.medicamento} (${proximaDosis.horaProgramada}).`,
          icono: "⚠️"
        });
      }
    };

    evaluarAlertasYHorarios();
    const intervalo = setInterval(evaluarAlertasYHorarios, 60000);
    return () => clearInterval(intervalo);
  }, [dosisDelDia]);

  // Manejador del botón Cumplido (Interacción de la UI para este Sprint)
  const handleCumplido = (id: string) => {
    setDosisDelDia(prev => prev.map(d => d.id === id ? { ...d, estado: "cumplido" } : d));
    alert("¡Toma registrada con éxito de forma local! El guardado en base de datos se activará en el próximo sprint.");
  };

  const handleAbrirModalNoCumplido = (dosis: any) => {
    setDosisSeleccionada(dosis);
    setMostrarModalNoCumplido(true);
  };

  // Guardar datos del formulario de omisión (Simulación interactiva local para este Sprint)
  const handleGuardarOmision = (e: React.FormEvent) => {
    e.preventDefault();
    
    setDosisDelDia(prev => prev.map(d => d.id === dosisSeleccionada.id ? { ...d, estado: "no_cumplido" } : d));
    
    console.log("Datos de omisión recolectados para el siguiente sprint:", {
      prescriptionId: dosisSeleccionada.id,
      motivo: motivoSeleccionado,
      efectoAnterior: efectoSeleccionado,
      observaciones: observaciones
    });
    
    alert("Registro de omisión guardado en la interfaz. El envío a Supabase se habilitará en el próximo sprint.");
    
    setMostrarModalNoCumplido(false);
    setMotivoSeleccionado("");
    setEfectoSeleccionado("");
    setObservaciones("");
  };

  const dosisActiva = dosisDelDia.find(d => d.estado === "pendiente") || null;

  return (
    <>
      <main className="w-full rounded-[32px] border border-slate-200 bg-white/60 p-6 shadow-sm">
        <div className="space-y-6">
          
          {/* 1. CARD DE AVISO DINÁMICO */}
          <div className={`flex items-center gap-4 border rounded-2xl p-4 shadow-sm transition-all hover:shadow-md cursor-pointer ${
            alertaSuperior.color === "orange" ? "bg-orange-50 border-orange-200" : 
            alertaSuperior.color === "red" ? "bg-red-50 border-red-200" : "bg-sky-50 border-sky-200"
          }`}>
            <div className={`text-3xl p-2 rounded-xl ${
              alertaSuperior.color === "orange" ? "bg-orange-100" : 
              alertaSuperior.color === "red" ? "bg-red-100" : "bg-sky-100"
            }`}>{alertaSuperior.icono}</div>
            <div className="flex-1 text-left">
              <h3 className={`font-bold text-base ${
                alertaSuperior.color === "orange" ? "text-orange-800" : 
                alertaSuperior.color === "red" ? "text-red-800" : "text-sky-800"
              }`}>{alertaSuperior.titulo}</h3>
              <p className={`text-sm mt-0.5 ${
                alertaSuperior.color === "orange" ? "text-orange-700" : 
                alertaSuperior.color === "red" ? "text-red-700" : "text-sky-700"
              }`}>{alertaSuperior.mensaje}</p>
            </div>
            <span className={`font-bold text-xl ${
              alertaSuperior.color === "orange" ? "text-orange-400" : 
              alertaSuperior.color === "red" ? "text-red-400" : "text-sky-400"
            }`}>➔</span>
          </div>

          {/* 2. MEDICAMENTO A TOMAR AHORA */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3 px-1 text-left">
              Medicamento a tomar ahora
            </h2>
            
            {dosisActiva ? (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-3 divide-x divide-slate-100 p-4">
                  <div className="col-span-2 pr-2 text-left">
                    <h3 className="text-xl font-bold text-slate-800">{dosisActiva.medicamento}</h3>
                    <div className="flex gap-2 items-center mt-1 text-sm text-slate-500">
                      <span>{dosisActiva.dosis}</span>
                      <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="text-sky-600 font-medium">{dosisActiva.frecuencia}</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center items-end pl-4 text-right">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Programada</span>
                    <span className="text-base font-bold text-sky-600 mt-0.5">{dosisActiva.horaProgramada}</span>
                  </div>
                </div>

                <div className="bg-slate-50/50 border-t border-slate-100 p-4 text-center">
                  <p className="text-sm font-semibold text-slate-700 mb-3">¿Tomaste tu medicamento?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => handleCumplido(dosisActiva.id)}
                      className="bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-all text-sm"
                    >
                      Cumplido
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleAbrirModalNoCumplido(dosisActiva)}
                      className="bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-all text-sm"
                    >
                      No cumplido
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center text-sm font-medium text-green-700">
                👍 No tienes medicamentos pendientes por tomar en este momento.
              </div>
            )}
          </div>

          {/* 3. DOSIS DEL DÍA */}
          <div>
            <div className="flex justify-between items-center mb-3 px-1">
              <h2 className="text-lg font-bold text-slate-900">Dosis del día</h2>
              <button type="button" className="text-sm font-medium text-sky-600 hover:underline">Ver todas</button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden">
              {dosisDelDia.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors group cursor-pointer">
                  <div className={`w-20 font-bold text-sm text-left ${
                    item.estado === "cumplido" ? "text-green-500 line-through" :
                    item.estado === "no_cumplido" ? "text-red-400 line-through" : "text-sky-600"
                  }`}>{item.horaProgramada}</div>
                  
                  <div className="flex-1 min-w-0 px-2 text-left">
                    <h4 className={`font-semibold text-sm truncate ${
                      item.estado !== "pendiente" ? "text-slate-400 line-through" : "text-slate-800"
                    }`}>{item.medicamento}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{item.dosis}</p>
                  </div>
                  
                  <div className="text-xs text-slate-500 font-medium px-3">{item.frecuencia}</div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-xs px-2.5 py-1 rounded-md border ${
                      item.estado === "cumplido" ? "bg-green-50 text-green-700 border-green-100" :
                      item.estado === "no_cumplido" ? "bg-red-50 text-red-600 border-red-100" :
                      "bg-orange-50 text-orange-600 border-orange-100"
                    }`}>
                      {item.estado === "cumplido" ? "Tomado" : item.estado === "no_cumplido" ? "Omitido" : "Pendiente"}
                    </span>
                    <span className="text-slate-300 group-hover:text-slate-400 transition-colors text-sm">➔</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* MODAL DE JUSTIFICACIÓN DE TU MOCKUP */}
      {mostrarModalNoCumplido && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-t-[24px] sm:rounded-[24px] p-6 shadow-xl max-h-[90vh] overflow-y-auto text-left">
            <div className="flex justify-end mb-2">
              <button 
                type="button"
                onClick={() => setMostrarModalNoCumplido(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
              >
                ✕ Cancelar
              </button>
            </div>

            <form onSubmit={handleGuardarOmision} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Motivo (¿Por qué no lo tomaste?)
                </label>
                <select 
                  required
                  value={motivoSeleccionado}
                  onChange={(e) => setMotivoSeleccionado(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm bg-white text-slate-700 focus:outline-none focus:border-red-400"
                >
                  <option value="" disabled>Selecciona una opción</option>
                  {MOTIVOS_OMISION.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  ¿Hubo algún efecto adverso en la toma anterior?
                </label>
                <select 
                  required
                  value={efectoSeleccionado}
                  onChange={(e) => setEfectoSeleccionado(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm bg-white text-slate-700 focus:outline-none focus:border-red-400"
                >
                  <option value="" disabled>Selecciona una opción</option>
                  {EFECTOS_ADVERSOS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Observaciones adicionales (opcional)
                </label>
                <textarea
                  placeholder="Escribe aquí..."
                  maxLength={MAX_CARACTERES}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm bg-white text-slate-700 focus:outline-none focus:border-red-400 h-24 resize-none"
                />
                <div className="text-right text-xs text-slate-400 mt-1 font-medium">
                  {observaciones.length}/{MAX_CARACTERES}
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl text-sm shadow-sm transition-all text-center"
                >
                  Guardar registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}