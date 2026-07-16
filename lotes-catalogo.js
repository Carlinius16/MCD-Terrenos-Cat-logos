// Credenciales de tu Supabase
const SUPABASE_URL = "https://eqpgpeubuhndyuybreca.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Emty_z6kOItvo_DKUC7OzA_tNbFShWe";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tu número de contacto de WhatsApp para el proyecto
const TELEFONO_WHATSAPP = "573219420775"; 

const gridLotes = document.getElementById('gridLotes');
const loadingStatus = document.getElementById('loadingStatus');

const filtroNumero = document.getElementById('filtroNumero');
const filtroSector = document.getElementById('filtroSector');
const filtroPrecio = document.getElementById('filtroPrecio');
const filtroEstado = document.getElementById('filtroEstado');

let todosLosLotes = [];

async function inicializarCatatogo() {
    try {
        const { data, error } = await supabase
            .from('terrenos')
            .select('*')
            .order('numero_lote', { ascending: true });

        if (error) throw error;

        todosLosLotes = data;
        
        loadingStatus.classList.add('hidden');
        gridLotes.classList.remove('hidden');

        construirFiltroSectores(todosLosLotes);
        escucharFiltros();
        renderizarTarjetas(todosLosLotes);

    } catch (error) {
        console.error("Error al obtener los terrenos de Supabase:", error);
        loadingStatus.innerText = "Error al sincronizar el catálogo de terrenos.";
        loadingStatus.className = "text-center py-20 text-red-500 font-medium text-sm";
    }
}

function construirFiltroSectores(lotes) {
    const sectoresUnicos = [...new Set(lotes.map(l => l.ubicacion_sector).filter(Boolean))];
    sectoresUnicos.forEach(sector => {
        const option = document.createElement('option');
        option.value = sector;
        option.innerText = sector;
        filtroSector.appendChild(option);
    });
}

function escucharFiltros() {
    const aplicarFiltros = () => {
        const valNumero = filtroNumero.value.toLowerCase().trim();
        const valSector = filtroSector.value;
        const valPrecio = filtroPrecio.value;
        const valEstado = filtroEstado.value;

        const resultadoFiltrado = todosLosLotes.filter(lote => {
            const coincideNumero = lote.numero_lote.toString().toLowerCase().includes(valNumero);
            const coincideSector = valSector === 'todos' || lote.ubicacion_sector === valSector;
            const coincidePrecio = valPrecio === 'todos' || Number(lote.precio) <= Number(valPrecio);
            const coincideEstado = valEstado === 'todos' || lote.estado === valEstado;

            return coincideNumero && coincideSector && coincidePrecio && coincideEstado;
        });

        renderizarTarjetas(resultadoFiltrado);
    };

    filtroNumero.addEventListener('input', aplicarFiltros);
    filtroSector.addEventListener('change', aplicarFiltros);
    filtroPrecio.addEventListener('change', aplicarFiltros);
    filtroEstado.addEventListener('change', aplicarFiltros);
}

function renderizarTarjetas(listaDeLotes) {
    gridLotes.innerHTML = "";

    if (listaDeLotes.length === 0) {
        gridLotes.innerHTML = `
            <div class="col-span-full text-center py-16 border border-dashed border-gray-200 rounded-lg text-gray-400 font-light text-sm">
                No se encontraron lotes con estos filtros.
            </div>`;
        return;
    }

    listaDeLotes.forEach(lote => {
        const esDisponible = lote.estado === 'Disponible';
        const badgeClass = esDisponible ? 'badge-disponible' : 'badge-reservado';
        
        const precioFormateado = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(lote.precio);

        // --- CONSTRUCCIÓN DEL MENSAJE INTELIGENTE DE WHATSAPP ---
        // Explicamos de forma clara qué lote es, su ubicación y precio para que te llegue estructurado
        const textoWhatsapp = `Hola MCD Terrenos, estoy interesado en el siguiente lote:\n\n` +
                              `• Lote Número: ${lote.numero_lote}\n` +
                              `• Medida: 6x12 Metros (72m²)\n` +
                              `• Sector/Etapa: ${lote.ubicacion_sector || 'No especificado'}\n` +
                              `• Precio de lista: ${precioFormateado}\n\n` +
                              `¿Me podrían dar más detalles sobre la disponibilidad actual y los métodos de pago?`;

        // Codificamos el texto para que sea compatible con enlaces URL seguros (reemplaza espacios por %20, etc.)
        const urlWhatsapp = `https://wa.me/${TELEFONO_WHATSAPP}?text=${encodeURIComponent(textoWhatsapp)}`;

        const cardHTML = `
            <div class="lote-card">
                <div class="relative h-60 w-full bg-gray-50 border-b border-gray-100">
                    <img src="${lote.foto_url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600'}" 
                         alt="Terreno" 
                         class="w-full h-full object-cover">
                    <span class="absolute top-4 left-4 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded shadow-sm ${badgeClass}">
                        ${lote.estado}
                    </span>
                </div>

                <div class="p-6 bg-white">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <span class="text-[10px] uppercase font-bold tracking-widest text-gray-400 block mb-0.5">
                                ${lote.ubicacion_sector || 'Sector General'}
                            </span>
                            <h3 class="text-base font-bold text-[#111111]">Lote Número ${lote.numero_lote}</h3>
                        </div>
                        <div class="text-right">
                            <span class="text-xs text-gray-400 block">Precio Total</span>
                            <span class="text-lg font-bold font-serif text-[#111111]">${precioFormateado}</span>
                        </div>
                    </div>

                    <div class="flex gap-4 py-3 my-3 border-y border-gray-100 text-xs text-gray-500 font-medium">
                        <div><span class="text-gray-400">Dimensión:</span> 6x12 Metros</div>
                        <div><span class="text-gray-400">Área:</span> 72 m²</div>
                    </div>

                    <p class="text-xs text-gray-400 font-light leading-relaxed mb-6 line-clamp-2">
                        ${lote.descripcion || 'Lote ideal listo para edificación, con acceso directo y excelente topografía.'}
                    </p>

                    <!-- BOTÓN DE WHATSAPP CON MENSAJE AUTOMÁTICO DE LOS DATOS DEL LOTE -->
                    <a href="${urlWhatsapp}" 
                       target="_blank" 
                       class="block text-center w-full btn-action font-bold py-3 px-4 rounded-md text-xs tracking-wider uppercase flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.665.988 3.3 1.49 5.362 1.491 5.482.002 9.944-4.461 9.947-9.948.002-2.657-1.029-5.153-2.903-7.03C17.18 1.78 14.685.751 12.013.751c-5.49 0-9.953 4.461-9.957 9.95 0 2.093.548 4.14 1.587 5.924l-.988 3.612 3.702-.971c1.7.923 3.354 1.392 4.69 1.392zm9.117-6.115c-.29-.145-1.716-.847-1.983-.944-.265-.097-.459-.145-.652.145-.194.29-.75.944-.919 1.139-.17.194-.339.218-.629.073-.29-.145-1.226-.452-2.336-1.442-.864-.771-1.447-1.723-1.617-2.014-.17-.29-.018-.447.127-.591.13-.13.29-.339.435-.509.145-.17.193-.29.29-.484.097-.194.048-.363-.024-.509-.073-.145-.652-1.573-.893-2.154-.236-.57-.475-.491-.652-.5h-.557c-.194 0-.508.073-.774.363-.266.29-1.015.992-1.015 2.42 0 1.428 1.04 2.81 1.185 3.003.145.194 2.045 3.123 4.956 4.38.692.299 1.233.478 1.656.612.696.22 1.329.189 1.83.114.558-.084 1.716-.702 1.958-1.38.242-.678.242-1.258.17-1.38-.072-.12-.266-.194-.557-.339z"/>
                        </svg>
                        Preguntar por WhatsApp
                    </a>
                </div>
            </div>
        `;
        gridLotes.innerHTML += cardHTML;
    });
}

document.addEventListener('DOMContentLoaded', inicializarCatatogo);