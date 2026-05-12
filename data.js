window.TYBACHA_DATA = {
  roles: [
    {
      id: "admin",
      name: "Administrador",
      description: "Gestion total del sistema, auditoria, roles y reportes.",
      permissions: [
        "dashboard:view",
        "users:manage",
        "roles:manage",
        "adults:manage",
        "caregivers:manage",
        "sft:manage",
        "plans:manage",
        "tracking:view",
        "alerts:manage",
        "reports:view",
        "consents:manage",
        "audit:view",
        "settings:manage"
      ]
    },
    {
      id: "professional",
      name: "Profesional",
      description: "Gestion clinica, pruebas SFT, planes y seguimiento.",
      permissions: [
        "dashboard:view",
        "adults:manage",
        "caregivers:view",
        "sft:manage",
        "plans:manage",
        "tracking:view",
        "alerts:view",
        "reports:view",
        "consents:view"
      ]
    },
    {
      id: "caregiver",
      name: "Cuidador",
      description: "Seguimiento diario de adultos mayores asignados.",
      permissions: [
        "dashboard:view",
        "adults:assigned",
        "tracking:manage",
        "alerts:view",
        "plans:view"
      ]
    },
    {
      id: "older_adult",
      name: "Adulto mayor",
      description: "Consulta de plan asignado, recordatorios y progreso propio.",
      permissions: ["dashboard:view", "plans:own", "tracking:own", "alerts:own"]
    }
  ],
  users: [
    {
      id: 1,
      name: "Valeria Rios",
      email: "admin@tybacha.local",
      role: "admin",
      status: "Activo",
      phone: "+57 300 100 2020",
      lastLogin: "2026-05-12 14:30"
    },
    {
      id: 2,
      name: "Dr. Mateo Salazar",
      email: "profesional@tybacha.local",
      role: "professional",
      status: "Activo",
      phone: "+57 301 222 1144",
      lastLogin: "2026-05-12 09:10"
    },
    {
      id: 3,
      name: "Claudia Mendez",
      email: "cuidador@tybacha.local",
      role: "caregiver",
      status: "Activo",
      phone: "+57 302 555 7788",
      lastLogin: "2026-05-11 18:05"
    },
  ],
  olderAdults: [
    {
      id: 101,
      firstName: "Elena",
      lastName: "Torres",
      birthDate: "1949-03-17",
      gender: "Femenino",
      status: "Activo",
      consent: "Vigente",
      phone: "+57 304 600 1020",
      address: "Calle 42 #15-30",
      caregiverId: 3,
      professionalId: 2,
      appAccess: "Sin acceso",
      adherence: 86,
      risk: "Bajo",
      pathologies: ["Hipertension controlada", "Artrosis leve"],
      medications: ["Losartan 50mg", "Acetaminofen ocasional"],
      emergencyContact: "Laura Torres - hija - +57 310 888 1299",
      updatedAt: "2026-05-12"
    },
    {
      id: 102,
      firstName: "Ramon",
      lastName: "Castillo",
      birthDate: "1944-10-02",
      gender: "Masculino",
      status: "Activo",
      consent: "Pendiente",
      phone: "+57 311 449 1900",
      address: "Carrera 9 #78-15",
      caregiverId: 3,
      professionalId: 2,
      appAccess: "Sin acceso",
      adherence: 62,
      risk: "Medio",
      pathologies: ["Diabetes tipo 2", "Riesgo de caida"],
      medications: ["Metformina 850mg"],
      emergencyContact: "Sofia Castillo - sobrina - +57 315 440 9822",
      updatedAt: "2026-05-09"
    },
    {
      id: 103,
      firstName: "Marta",
      lastName: "Gomez",
      birthDate: "1952-07-28",
      gender: "Femenino",
      status: "Inactivo",
      consent: "Vencido",
      phone: "+57 312 111 0001",
      address: "Av. 19 #100-20",
      caregiverId: null,
      professionalId: 2,
      appAccess: "Sin acceso",
      adherence: 38,
      risk: "Alto",
      pathologies: ["EPOC", "Dolor lumbar cronico"],
      medications: ["Salbutamol"],
      emergencyContact: "Andres Gomez - hijo - +57 316 781 4501",
      updatedAt: "2026-04-28"
    }
  ],
  caregivers: [
    {
      id: 3,
      name: "Claudia Mendez",
      email: "cuidador@tybacha.local",
      phone: "+57 302 555 7788",
      status: "Activo",
      assignedAdults: [101, 102],
      shift: "Manana",
      permissions: "Seguimiento y alertas"
    },
    {
      id: 5,
      name: "Jorge Parra",
      email: "jorge.parra@tybacha.local",
      phone: "+57 300 345 8770",
      status: "Activo",
      assignedAdults: [],
      shift: "Tarde",
      permissions: "Consulta limitada"
    }
  ],
  sftResults: [
    {
      id: 501,
      adultId: 101,
      battery: "Senior Fitness Test base",
      date: "2026-05-01",
      responsible: "Dr. Mateo Salazar",
      chairStand: 14,
      armCurl: 17,
      twoMinuteStep: 78,
      chairSitReach: 2,
      backScratch: -4,
      eightFootUpGo: 6.8,
      notes: "Buen control postural, mejorar movilidad de hombro."
    },
    {
      id: 502,
      adultId: 102,
      battery: "Senior Fitness Test base",
      date: "2026-04-26",
      responsible: "Dr. Mateo Salazar",
      chairStand: 9,
      armCurl: 12,
      twoMinuteStep: 54,
      chairSitReach: -6,
      backScratch: -12,
      eightFootUpGo: 9.4,
      notes: "Riesgo moderado de caida, requiere progresion suave."
    }
  ],
  plans: [
    {
      id: 701,
      adultId: 101,
      title: "Plan semanal movilidad y fuerza",
      source: "Gemini AI",
      status: "Asignado",
      adherence: 86,
      reviewedBy: "Dr. Mateo Salazar",
      createdAt: "2026-05-06",
      exercises: [
        { day: "Lunes", name: "Sentarse y levantarse asistido", duration: "15 min", intensity: "Baja", status: "Completado" },
        { day: "Martes", name: "Caminata controlada", duration: "20 min", intensity: "Media", status: "Completado" },
        { day: "Miercoles", name: "Movilidad de hombros con banda", duration: "12 min", intensity: "Baja", status: "Pendiente" },
        { day: "Jueves", name: "Equilibrio junto a pared", duration: "10 min", intensity: "Baja", status: "Pendiente" },
        { day: "Viernes", name: "Marcha estatica progresiva", duration: "15 min", intensity: "Media", status: "Pendiente" }
      ]
    },
    {
      id: 702,
      adultId: 102,
      title: "Plan preventivo de caidas",
      source: "Manual",
      status: "Revisado",
      adherence: 62,
      reviewedBy: "Dr. Mateo Salazar",
      createdAt: "2026-05-02",
      exercises: [
        { day: "Lunes", name: "Transferencias silla-pie", duration: "10 min", intensity: "Baja", status: "Completado" },
        { day: "Martes", name: "Caminata con pausas", duration: "15 min", intensity: "Baja", status: "Omitido" },
        { day: "Miercoles", name: "Flexibilidad de pantorrilla", duration: "10 min", intensity: "Baja", status: "Pendiente" },
        { day: "Jueves", name: "Paso lateral asistido", duration: "12 min", intensity: "Baja", status: "Pendiente" },
        { day: "Viernes", name: "Respiracion y movilidad toracica", duration: "10 min", intensity: "Baja", status: "Pendiente" }
      ]
    }
  ],
  activityLogs: [
    { id: 801, adultId: 101, date: "2026-05-12", planId: 701, exercise: "Caminata controlada", status: "Completado", minutes: 20, notes: "Sin dolor ni fatiga excesiva." },
    { id: 802, adultId: 101, date: "2026-05-11", planId: 701, exercise: "Sentarse y levantarse asistido", status: "Completado", minutes: 15, notes: "Requiere una pausa intermedia." },
    { id: 803, adultId: 102, date: "2026-05-10", planId: 702, exercise: "Caminata con pausas", status: "Omitido", minutes: 0, notes: "Refirio mareo leve." }
  ],
  notifications: [
    { id: 901, to: "Claudia Mendez", type: "Recordatorio", status: "Enviada", date: "2026-05-12 08:00", content: "Elena tiene caminata controlada programada." },
    { id: 902, to: "Dr. Mateo Salazar", type: "Alerta", status: "Leida", date: "2026-05-10 18:30", content: "Ramon omitio una actividad por mareo." },
    { id: 903, to: "Elena Torres", type: "Progreso", status: "Recibida", date: "2026-05-09 17:15", content: "Cumplimiento semanal superior al 80%." }
  ],
  consents: [
    { id: 1001, adultId: 101, type: "Tratamiento de datos y seguimiento clinico", status: "Vigente", date: "2026-01-15", expiresAt: "2027-01-15", signedBy: "Elena Torres" },
    { id: 1002, adultId: 102, type: "Uso de datos para planes personalizados", status: "Pendiente", date: "2026-05-03", expiresAt: "", signedBy: "Ramon Castillo" },
    { id: 1003, adultId: 103, type: "Tratamiento de datos sensibles", status: "Vencido", date: "2025-02-20", expiresAt: "2026-02-20", signedBy: "Marta Gomez" }
  ],
  auditLogs: [
    { id: 1101, user: "Valeria Rios", action: "Actualizo rol", entity: "users", detail: "Asigno Profesional a Dr. Mateo", date: "2026-05-12 13:20" },
    { id: 1102, user: "Dr. Mateo Salazar", action: "Modifico ficha", entity: "older_adults", detail: "Actualizo medicamentos de Elena Torres", date: "2026-05-12 10:14" },
    { id: 1103, user: "Claudia Mendez", action: "Registro actividad", entity: "activity_logs", detail: "Caminata controlada completada", date: "2026-05-12 09:45" }
  ]
};
