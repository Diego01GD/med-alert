"use client";

import React, { useState } from "react";
import { LogOut, Bell, ChevronRight, Package, AlertTriangle } from "lucide-react";

export default function FarmaceuticoPage() {
  // 1. Estado para controlar qué paciente está seleccionado y actualizar la pantalla
  const [selectedPatientId, setSelectedPatientId] = useState(1);

  // Arreglo con la información detallada de cada paciente para cambiar las tarjetas
  const patients = [
    { id: 1, name: "Juan Pérez Ramírez", age: 65, weight: 78, phone: "(52) 9881090031", uid: "PA-0001", doctor: "Dr. Carlos Ruiz Hernández", stockStatus: "Stock bajo" },
    { id: 2, name: "María López Gómez", age: 58, weight: 88, phone: "(52) 9992345678", uid: "PA-0002", doctor: "Dra. Ana Gabriel Méndez", stockStatus: "Stock OK" },
    { id: 3, name: "Aldair Jacinto Canek", age: 35, weight: 58, phone: "(52) 9998765432", uid: "PA-0003", doctor: "Dr. Carlos Ruiz Hernández", stockStatus: "Stock bajo" },
    { id: 4, name: "Israel Chen Mex", age: 25, weight: 64, phone: "(52) 9811234567", uid: "PA-0004", doctor: "Dr. Italia Escalante", stockStatus: "Stock bajo" },
    { id: 5, name: "Romina Can Euan", age: 43, weight: 57, phone: "(52) 9993456789", uid: "PA-0005", doctor: "Dra. Ana Gabriel Méndez", stockStatus: "Stock OK" },
    { id: 6, name: "Yobana Burgos Coh", age: 35, weight: 75, phone: "(52) 9990123456", uid: "PA-0006", doctor: "Dr. Carlos Ruiz Hernández", stockStatus: "Stock bajo" },
  ];

  // Diccionario de medicamentos asociados a cada paciente
  const medicationsMap: Record<number, Array<{ id: number; name: string; dosage: string; stock: string; status: string; lastUpdate: string }>> = {
    1: [
      { id: 1, name: "Metformina 850mg", dosage: "1 tableta cada 12 horas", stock: "40 Pastillas", status: "Normal", lastUpdate: "12/06/2026" },
      { id: 2, name: "Losartán 50mg", dosage: "1 tableta cada 24 horas", stock: "18 Pastillas", status: "Bajo", lastUpdate: "12/06/2026" },
      { id: 3, name: "Ketorolaco 500mg", dosage: "1 tableta cada 6 horas", stock: "38 Pastillas", status: "Normal", lastUpdate: "12/06/2026" },
    ],
    2: [
      { id: 1, name: "Insulina Glargina", dosage: "10 UI cada 24 horas", stock: "2 Viales", status: "Normal", lastUpdate: "13/06/2026" },
    ],
    3: [
      { id: 1, name: "Amoxicilina 500mg", dosage: "1 cápsula cada 8 horas", stock: "3 Cápsulas", status: "Bajo", lastUpdate: "11/06/2026" },
    ],
    4: [
      { id: 1, name: "Metformina 850mg", dosage: "1 tableta cada 12 horas", stock: "5 Pastillas", status: "Bajo", lastUpdate: "10/06/2026" },
    ],
    5: [
      { id: 1, name: "Losartán 50mg", dosage: "1 tableta cada 24 horas", stock: "30 Pastillas", status: "Normal", lastUpdate: "12/06/2026" },
    ],
    6: [
      { id: 1, name: "Ketorolaco 500mg", dosage: "1 tableta cada 6 horas", stock: "8 Pastillas", status: "Bajo", lastUpdate: "12/06/2026" },
    ]
  };

  const currentPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const currentMedications = medicationsMap[currentPatient.id] || [];

  return (
    <div className="min-h-screen w-full bg-[#E8F5FF] p-6 lg:p-8 font-sans text-slate-800 flex flex-col justify-between">
      
      {/* HEADER PRINCIPAL */}
      <header className="relative flex justify-between items-center w-full max-w-[1550px] mx-auto mb-6">
        {/* Logo MedAlert Izquierda */}
        <div className="flex flex-col items-center select-none">
          <div className="w-14 h-14 bg-sky-400 rounded-full flex items-center justify-center shadow-sm border border-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>
          <span className="font-black text-xl tracking-tight text-slate-900 mt-1">MedAlert</span>
        </div>

        {/* Título Central */}
        <div className="text-center absolute left-1/2 -translate-x-1/2">
          <h1 className="text-4xl font-extrabold tracking-tight text-black">Farmacéutico</h1>
          <p className="text-slate-600 font-medium text-sm mt-0.5">Panel de Farmacéutico</p>
        </div>

        {/* Botón Cerrar Sesión */}
        <button className="bg-[#EF4444] hover:bg-red-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-md transition-colors border border-red-500">
          <LogOut className="w-5 h-5 stroke-[2.5]" />
          Cerrar Sesión
        </button>
      </header>

      {/* BARRA DE ALERTAS */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-3 px-6 mb-6 flex items-center w-full max-w-[1550px] mx-auto justify-between gap-4">
        <div className="flex items-center gap-2.5 font-black text-xl text-black shrink-0">
          <div className="bg-[#FFF0E6] p-2 rounded-xl border border-orange-200">
            <Bell className="w-5 h-5 fill-orange-500 text-orange-500" />
          </div>
          Alertas
        </div>
        
        <div className="flex flex-1 flex-wrap items-center justify-start gap-x-12 gap-y-2 pl-6">
          <div className="flex items-center gap-2 text-sm font-bold text-black">
            <div className="bg-[#FFF0E6] p-1 rounded-md">
              <Bell className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            </div>
            <span>3 pacientes tienen medicamentos con stock bajo</span>
            <button className="text-blue-600 font-bold hover:underline ml-1">Ver detalles</button>
          </div>
          
          <div className="flex items-center gap-2 text-sm font-bold text-black">
            <div className="bg-[#FFF0E6] p-1 rounded-md">
              <Bell className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            </div>
            <span>2 pacientes requieren recarga de medicamentos</span>
            <button className="text-blue-600 font-bold hover:underline ml-1">Ver detalles</button>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL ASIMÉTRICO */}
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[1550px] mx-auto flex-1 items-start">
        
        {/* COLUMNA IZQUIERDA - LISTA DE PACIENTES */}
        <div className="w-full lg:w-[350px] shrink-0 bg-white rounded-[32px] border border-slate-300 shadow-sm p-5 flex flex-col">
          <h2 className="text-2xl font-black text-center mb-5 text-black">Pacientes</h2>
          
          <div className="flex flex-col space-y-3">
            {patients.map((patient) => {
              const isSelected = selectedPatientId === patient.id;
              return (
                <div 
                  key={patient.id}
                  onClick={() => setSelectedPatientId(patient.id)}
                  className={`rounded-2xl p-3.5 flex items-center gap-3.5 cursor-pointer border transition-all ${
                    isSelected 
                      ? "bg-[#C4B2FF] border-purple-400 shadow-sm" 
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  {/* Avatar Circular */}
                  <div className={`w-12 h-12 rounded-full shrink-0 border ${
                    isSelected ? "bg-white/70 border-purple-300" : "bg-[#F3EBFF] border-purple-100"
                  }`}></div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className="font-extrabold text-[15px] text-black truncate pr-1">{patient.name}</h3>
                      <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? "text-black" : "text-slate-400"}`} />
                    </div>
                    <p className={`text-xs font-medium ${isSelected ? "text-slate-900" : "text-slate-500"}`}>
                      Edad: {patient.age} años | Peso: {patient.weight} kg
                    </p>
                    <p className={`text-xs text-right font-bold mt-1 ${
                      patient.stockStatus === "Stock bajo" ? "text-red-600" : "text-green-600"
                    }`}>
                      {patient.stockStatus}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* COLUMNA DERECHA - DETALLES Y FORMULARIOS */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          
          {/* TARJETA: INFORMACIÓN DEL PACIENTE ACTIVO */}
          <div className="bg-white rounded-[32px] border border-slate-300 shadow-sm p-6 flex items-center gap-6 text-left">
            <div className="w-24 h-24 rounded-full bg-[#EADDFF] shrink-0 border border-purple-200"></div>
            <div className="flex-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Información del Paciente</h3>
              <h2 className="text-3xl font-black text-black mb-2">{currentPatient.name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-slate-600">
                <span>Edad: {currentPatient.age} años</span>
                <span className="text-slate-300">|</span>
                <span>Peso: {currentPatient.weight} kg</span>
                <span className="text-slate-300">|</span>
                <span>Teléfono: {currentPatient.phone}</span>
                <span className="text-slate-300">|</span>
                <span>ID: {currentPatient.uid}</span>
              </div>
              <p className="text-sm font-bold text-black mt-2.5">
                Médico responsable: <span className="font-extrabold text-slate-800">{currentPatient.doctor}</span>
              </p>
            </div>
          </div>
          
          {/* TARJETA: TABLA DE STOCK DE MEDICAMENTOS */}
          <div className="bg-white rounded-[32px] border border-slate-300 shadow-sm p-6 flex flex-col">
            <h2 className="text-2xl font-black mb-5 text-black text-left">Stock de Medicamentos</h2>
            
            <div className="w-full overflow-hidden rounded-xl border border-slate-200">
              {/* Encabezado de Tabla */}
              <div className="grid grid-cols-6 gap-2 text-xs font-black bg-slate-50 p-3.5 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-left">
                <div>Medicamento</div>
                <div>Dosis</div>
                <div>Stock actual</div>
                <div>Estado</div>
                <div>Última actualización</div>
                <div className="text-center">Acciones</div>
              </div>
              
              {/* Filas de la Tabla */}
              <div className="divide-y divide-slate-100 bg-white">
                {currentMedications.map((med) => (
                  <div key={med.id} className="grid grid-cols-6 gap-2 text-sm items-center p-3.5 text-left transition-colors hover:bg-slate-50/30">
                    <div className="font-extrabold text-slate-900">{med.name}</div>
                    <div className="text-slate-600 text-xs font-medium">{med.dosage}</div>
                    <div className="text-slate-700 font-semibold">{med.stock}</div>
                    <div>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        med.status === "Bajo" ? "bg-red-50 text-red-600 font-black" : "bg-slate-100 text-slate-700"
                      }`}>
                        {med.status}
                      </span>
                    </div>
                    <div className="text-slate-500 font-medium text-xs">{med.lastUpdate}</div>
                    <div className="flex justify-center items-center gap-3">
                      <button className="p-1 rounded-lg hover:bg-sky-50 transition-colors" title="Surtir Inventario">
                        <Package className="w-6 h-6 text-sky-400" strokeWidth={2.5} />
                      </button>
                      <button className="p-1 rounded-lg hover:bg-red-50 transition-colors" title="Reportar Alerta">
                        <AlertTriangle className="w-6 h-6 text-white fill-red-500" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* FORMULARIOS INFERIORES CON BORDE NEGRO REFORZADO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-left">
              
              {/* Formulario 1: Sugerencia de medicamento */}
              <div className="border border-black rounded-2xl p-5 flex flex-col bg-white shadow-sm">
                <h3 className="text-lg font-black mb-3 text-black">Sugerencia de medicamento</h3>
                <input 
                  type="text" 
                  placeholder="Escribe el nombre del medicamento genérico..." 
                  className="w-full border border-slate-400 rounded-lg px-4 py-2.5 text-sm mb-4 outline-none focus:border-sky-400 bg-white text-black placeholder:text-slate-400 font-medium shadow-inner"
                />
                <button className="bg-sky-400 hover:bg-sky-500 text-white font-extrabold py-2.5 w-full rounded-xl transition-all shadow-sm text-sm border border-sky-500 mt-auto">
                  Enviar sugerencia
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-2 font-medium">El paciente recibirá una notificación SMS con tu sugerencia</p>
              </div>
              
              {/* Formulario 2: Reporte observación */}
              <div className="border border-black rounded-2xl p-5 flex flex-col bg-white shadow-sm">
                <h3 className="text-lg font-black mb-3 text-black">Reporte observación</h3>
                <textarea 
                  placeholder="Escribe el nombre del medicamento genérico..." 
                  className="w-full border border-slate-400 rounded-lg px-4 py-2.5 text-sm mb-4 outline-none focus:border-red-400 resize-none h-[76px] bg-white text-black placeholder:text-slate-400 font-medium shadow-inner"
                />
                <button className="bg-[#EF4444] hover:bg-red-600 text-white font-extrabold py-2.5 w-full rounded-xl transition-all shadow-sm text-sm border border-red-500 mt-auto">
                  Enviar Observación
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-2 font-medium">El médico responsable recibirá una notificación SMS</p>
              </div>

            </div>

          </div>
        </div>
      </div>

    </div>
  );
}