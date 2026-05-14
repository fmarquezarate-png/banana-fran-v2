import type { Destination } from './destinations'

export const DESTINATIONS_REST: Destination[] = [

  // ─── ORIENTE MEDIO ──────────────────────────────────────────
  {
    id: 'jordania-petra',
    name: 'Jordania — Petra',
    shortName: 'Petra · Wadi Rum',
    country: 'Jordania',
    match: '👌', matchLabel: '---', category: 'ok',
    tagline: 'La ciudad rosa esculpida en roca hace 2300 años. El desierto de Marte. La hospitalidad árabe.',
    scales: { playa_ciudad: 3, relax_fiesta: 2, lowcost_fancy: 5, invierno_verano: 4, occidental_exotico: 8, streetfood_gourmet: 6, descanso_aventura: 7, solo_grupal: 5, naturaleza_metropolis: 3, moderno_historico: 10, turistico_desconocido: 5 },
    coords: [30.3285, 35.4444],
    images: [
      'https://images.unsplash.com/photo-1562979314-bee7453e911c?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1579606032821-4d6fbbac3498?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1548786811-dd6e453ccca7?auto=format&fit=crop&w=1600&q=75',
    ],
    story: [
      'Petra fue construida por los nabateos hace 2300 años en el interior de un cañón de arenisca rosa en el desierto de Jordania. La entrada es por el Siq, un desfiladero de 1,2 km de paredes de 80 metros de altura, que termina de repente frente al Tesoro (Al-Khazneh): una fachada de 43 metros tallada directamente en la roca. Cuando aparece al doblar la esquina, el efecto es el más poderoso que produce cualquier monumento arqueológico del mundo.',
      'La ciudad entera tiene 800 edificios excavados en la roca — templos, tumbas reales, un teatro romano para 8.500 espectadores y un monasterio en la cima de la montaña accesible por 850 escalones. Solo se ha excavado el 15% del yacimiento.',
      'A 1 hora al sur, Wadi Rum es el desierto más espectacular de Oriente Medio: formaciones de arenisca roja de hasta 1750 m, valles de arena fina y silencio absoluto. Se puede dormir en tienda beduina bajo el cielo de estrellas más denso que verás en tu vida.',
    ],
    fit: 'Historia antigua al máximo nivel, aventura en desierto y cultura árabe auténtica. Jordania es el país más seguro y turístico de Oriente Medio. Imprescindible en la vida.',
    facts: {
      vuelo: 'BCN → AMM (~4-5 h, desde 150 €)',
      temp: 'Mar-may y sep-nov: 20-28 °C, perfecto. Jun-ago: 35-40 °C en el desierto. Dic-feb: frío (Petra puede nevar)',
      crowds: 'Media — Petra es turística pero manejable fuera de temporada alta',
      lang: 'Árabe — inglés muy bueno en zonas turísticas',
      currency: 'Dinar jordano (JOD) — 1 EUR ≈ 0.8 JOD. Precio moderado',
    },
    musts: [
      'Petra de noche con velas (lunes, miércoles y jueves)',
      'Monasterio Ad Deir (850 escalones, sin multitudes)',
      'Noche en tienda beduina en Wadi Rum',
      'Mar Muerto — flotar sin hundirse (el punto más bajo de la Tierra)',
      'Jerash — las ruinas romanas mejor conservadas fuera de Italia',
    ],
    dishes: ['Mansaf (cordero con arroz y yogur fermentado)', 'Falafel y hummus de Amán', 'Maqluba (arroz volcado)', 'Knafeh (postre de queso y miel)', 'Té con menta beduino'],
    plans7: [
      ['Día 1', 'Amán', 'Llegada. Ciudadela, mercado romano, downtown. Mansaf de bienvenida.'],
      ['Día 2', 'Jerash + Mar Muerto', 'Ruinas romanas de Jerash. Tarde flotando en el Mar Muerto.'],
      ['Día 3', 'Petra día 1', 'El Siq y el Tesoro. Calle de las Fachadas, teatro romano.'],
      ['Día 4', 'Petra día 2', 'Monasterio Ad Deir. Petra de noche con velas.'],
      ['Día 5', 'Wadi Rum', 'Excursión en jeep por el desierto. Noche en campamento beduino.'],
      ['Día 6', 'Aqaba', 'Mar Rojo: snorkel y buceo con arrecifes excepcionales.'],
      ['Día 7', 'Vuelta', 'Vuelo desde Amán.'],
    ],
    budget: { flightPP: 200, fr: 0.25, hotelPD: 80, hr: 0.35, foodPD: 35, fdr: 0.20, actPD: 40, ar: 0.25 },
  },

  // ─── EGIPTO ─────────────────────────────────────────────────
  {
    id: 'egipto',
    name: 'Egipto',
    shortName: 'Cairo · Luxor · Mar Rojo',
    country: 'Egipto',
    match: '👌', matchLabel: '---', category: 'ok',
    tagline: 'Las pirámides, el Nilo y 5000 años de civilización. La historia más antigua a tu alcance.',
    scales: { playa_ciudad: 5, relax_fiesta: 3, lowcost_fancy: 4, invierno_verano: 4, occidental_exotico: 9, streetfood_gourmet: 6, descanso_aventura: 5, solo_grupal: 5, naturaleza_metropolis: 5, moderno_historico: 10, turistico_desconocido: 5 },
    coords: [26.8206, 30.8025],
    images: [
      'https://images.unsplash.com/photo-1539650116574-75c0c6d73e6e?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?auto=format&fit=crop&w=1600&q=75',
    ],
    story: [
      'Las pirámides de Guiza tienen 4500 años y siguen siendo la única de las Siete Maravillas del Mundo Antiguo que sigue en pie. La Gran Pirámide de Keops tardó 20 años en construirse, tiene 2,3 millones de bloques de piedra de 2,5 toneladas cada uno y ningún arqueólogo sabe exactamente cómo lo hicieron. La Esfinge, a su lado, lleva vigilando el horizonte desde hace 4600 años.',
      'Luxor, a 700 km al sur por el Nilo, tiene la mayor concentración de templos y tumbas del mundo antiguo: el Valle de los Reyes (donde estaba Tutankamón), el templo de Karnak (el complejo religioso más grande de la historia), y el templo de Luxor que conectaba con Karnak por una avenida de 3 km de esfinges.',
      'El Mar Rojo en Hurgada y Sharm el-Sheij tiene los arrecifes de coral más accesibles del mundo: visibilidad de 30 metros, temperatura 26 grados y colorido que supera cualquier acuario del planeta.',
    ],
    fit: 'Historia faraónica incomparable, buceo excepcional y precio muy asequible. Requiere guía para aprovechar el contexto histórico. Mejor oct-abr (evitar el calor extremo de verano).',
    facts: {
      vuelo: 'BCN → CAI (~4-5 h, desde 150 €) · BCN → Hurgada direct en temporada (~4 h, desde 200 €)',
      temp: 'Oct-abr: 20-28 °C, ideal. May-sep: 35-45 °C en el interior, insoportable',
      crowds: 'Media — muy turístico en temporada alta pero el tamaño de los yacimientos lo absorbe',
      lang: 'Árabe — inglés suficiente en zonas turísticas',
      currency: 'Libra egipcia (EGP) — 1 EUR ≈ 55 EGP. Muy barato',
    },
    musts: [
      'Pirámides de Guiza al amanecer (sin turistas)',
      'Museo Egipcio de El Cairo — la máscara de Tutankamón',
      'Crucero por el Nilo Luxor → Asuán (3-4 días)',
      'Valle de los Reyes — tumbas de los faraones',
      'Buceo en el Mar Rojo (Ras Mohammed o Thistlegorm)',
    ],
    dishes: ['Koshary (pasta + lentejas + salsa de tomate)', 'Ful medames (habas con aceite)', 'Shawarma de pollo', 'Om Ali (pudín de hojaldre con leche)', 'Té con menta'],
    plans7: [
      ['Día 1-2', 'El Cairo', 'Pirámides al amanecer, Esfinge, Museo Egipcio (máscara de Tutankamón), Khan el-Khalili.'],
      ['Día 3', 'Vuelo a Luxor', 'Valle de los Reyes, Templo de Hatshepsut, Colossos de Memnon.'],
      ['Día 4', 'Karnak y Luxor', 'Templo de Karnak (el más grande del mundo antiguo). Templo de Luxor de noche.'],
      ['Día 5', 'Crucero Nilo', 'Crucero Luxor → Esna → Edfú. Templo de Horus.'],
      ['Día 6', 'Asuán', 'Alto Assuán, Templo de Filé, Nilo en feluca.'],
      ['Día 7', 'Mar Rojo', 'Vuelo a Hurgada o Sharm. Snorkel en el arrecife. Vuelo nocturno de vuelta.'],
    ],
    budget: { flightPP: 200, fr: 0.25, hotelPD: 60, hr: 0.35, foodPD: 20, fdr: 0.20, actPD: 40, ar: 0.25 },
  },

  // ─── OCEANÍA ────────────────────────────────────────────────
  {
    id: 'nueva-zelanda',
    name: 'Nueva Zelanda',
    shortName: 'South Island',
    country: 'Nueva Zelanda',
    match: '👌', matchLabel: '---', category: 'ok',
    tagline: 'Los Alpes, los fiordos y las playas más dramáticos del mundo. El planeta cuando aún era joven.',
    scales: { playa_ciudad: 4, relax_fiesta: 3, lowcost_fancy: 7, invierno_verano: 5, occidental_exotico: 4, streetfood_gourmet: 5, descanso_aventura: 9, solo_grupal: 4, naturaleza_metropolis: 2, moderno_historico: 4, turistico_desconocido: 5 },
    coords: [-45.0312, 168.6626],
    images: [
      'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1469521669194-babb45599def?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1600&q=75',
    ],
    story: [
      'Nueva Zelanda tiene la densidad de paisajes espectaculares por kilómetro cuadrado más alta del mundo. En la Isla Sur, en un radio de 100 km, puedes estar en los Alpes del Sur (picos de 3700 m con glaciares), en los fiordos del Fiordland (Milford Sound y Doubtful Sound, con cascadas de 160 m cayendo al mar), en playas doradas de la costa oeste con olas de surfistas y en viñedos de Marlborough que producen el mejor Sauvignon Blanc del mundo.',
      'Peter Jackson no eligió Nueva Zelanda para rodar El Señor de los Anillos por casualidad: el país parece diseñado por alguien que quisiera meter todos los paisajes posibles en un espacio manejable. El Hobbiton existe de verdad en Matamata y se puede visitar.',
      'La cultura maorí impregna el país: el haka (la danza de guerra) se practica en competiciones escolares. Los kiwis (los neozelandeses) son los más amables del mundo anglosajón. Y el país lleva décadas siendo la capital mundial del turismo de aventura: bungee, salto base, rafting en aguas bravas y parapente en Queenstown.',
    ],
    fit: 'La capital mundial de la aventura. Para amantes de la naturaleza extrema, road trips épicos y deportes al límite. Requiere tiempo (mínimo 2 semanas) y presupuesto holgado.',
    facts: {
      vuelo: 'BCN → AKL (~26 h con 1-2 escalas, desde 900 €)',
      temp: 'Dic-feb (verano austral): 20-26 °C, ideal. Jun-ago (invierno): esquí en los Alpes del Sur.',
      crowds: 'Baja-media — el tamaño del país hace que todo parezca vacío',
      lang: 'Inglés · maorí (co-oficial)',
      currency: 'Dólar neozelandés (NZD) — 1 EUR ≈ 1.8 NZD. Caro similar a Australia',
    },
    musts: [
      'Milford Sound en crucero al amanecer (fiordos con cascadas)',
      'Tongariro Alpine Crossing — mejor senderismo de un día del mundo',
      'Queenstown: bungee y parapente sobre el lago Wakatipu',
      'Glaciares Franz Josef y Fox (accesibles en helicóptero)',
      'Hobbiton en Matamata — El Señor de los Anillos real',
    ],
    dishes: ['Hangi maorí (cocción en tierra)', 'Whitebait fritters', 'Lamb rack', 'Pavlova', 'Flat white (el café neozelandés que conquistó el mundo)'],
    plans7: [
      ['Día 1', 'Auckland', 'Llegada. Sky Tower, barrio de Ponsonby. Descanso jet lag.'],
      ['Día 2', 'Rotorua', 'Geotermia, Wai-O-Tapu, haka maorí y hangi.'],
      ['Día 3', 'Vuelo a Queenstown', 'Llegada. Paseo lago Wakatipu. Cena con vistas.'],
      ['Día 4', 'Queenstown aventura', 'Bungee, parapente o rafting. Tarde libre.'],
      ['Día 5', 'Milford Sound', 'Drive épico + crucero en el fiordo. Cascadas de 160 m.'],
      ['Día 6', 'Franz Josef', 'Vuelo o drive. Helicóptero al glaciar.'],
      ['Día 7', 'Vuelta', 'Drive a Christchurch. Vuelo a Auckland y conexión.'],
    ],
    budget: { flightPP: 950, fr: 0.25, hotelPD: 110, hr: 0.35, foodPD: 60, fdr: 0.20, actPD: 70, ar: 0.30 },
  },

]
