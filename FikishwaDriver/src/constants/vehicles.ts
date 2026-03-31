export const CAR_BRANDS_AND_MODELS: Record<string, string[]> = {
    "Toyota": [
        "Vitz", "Belta", "Passo", "Axio", "Fielder", "Probox", "Succeed",
        "Premio", "Allion", "Aqua", "Prius", "Corolla", "Yaris", "Noah",
        "Voxy", "Auris", "Ractis", "Sienta", "Wish", "Crown"
    ],
    "Nissan": [
        "Note", "Tiida", "AD Van", "Wingroad", "Sylphy", "March", "Juke",
        "X-Trail", "Qashqai", "Dayz", "Sentra", "Bluebird", "Leaf"
    ],
    "Honda": [
        "Fit", "Insight", "Civic", "Airwave", "Stream", "CR-V", "HR-V",
        "Vezel", "Freed", "Accord", "Grace", "Shuttle", "Stepwgn"
    ],
    "Mazda": [
        "Demio", "Axela (Mazda3)", "Atenza (Mazda6)", "CX-5", "Premacy",
        "Verisa", "CX-3", "Biante", "Familia"
    ],
    "Subaru": [
        "Impreza", "Legacy", "Forester", "Outback", "XV", "Trezia", "Exiga"
    ],
    "Volkswagen": [
        "Golf", "Polo", "Passat", "Tiguan", "Jetta", "Touareg", "Touran"
    ],
    "Suzuki": [
        "Swift", "Alto", "Wagon R", "Jimny", "Vitara", "Ertiga", "Spacia"
    ],
    "Mitsubishi": [
        "Lancer", "Mirage", "Outlander", "Pajero", "Galant", "RVR"
    ],
    "Hyundai": [
        "Elantra", "Accent", "Sonata", "Tucson", "Santa Fe", "i20"
    ],
    "Kia": [
        "Rio", "Sportage", "Sorento", "Cerato", "Picanto", "Optima"
    ],
    "Ford": [
        "Focus", "Fiesta", "Ranger", "Everest", "Escape", "Ecosport"
    ],
    "Chevrolet": [
        "Cruze", "Spark", "Aveo", "Optra"
    ],
    "Mercedes-Benz": [
        "C-Class", "E-Class", "GLC", "GLE", "A-Class"
    ],
    "BMW": [
        "3 Series", "5 Series", "X1", "X3", "X5", "1 Series"
    ],
    "Audi": [
        "A3", "A4", "A6", "Q3", "Q5", "Q7"
    ]
};

export const CAR_BRANDS = Object.keys(CAR_BRANDS_AND_MODELS).sort();
