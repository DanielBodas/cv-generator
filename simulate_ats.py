import os
import json
import re

def load_json(filepath):
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error cargando {filepath}: {e}")
    return None

def analyze_keywords(text):
    # Palabras clave relevantes para Project Managers, Technical Product Owners e Ingenieros Aeroespaciales
    keywords = [
        "Product Owner", "Project Manager", "Agile", "Digital Twin", "Digital Transformation",
        "Aerospace", "Engineering", "Scrum", "Kanban", "Change Management", "Process Optimization",
        "Stakeholder Management", "Python", "SQL", "Airworthiness", "Aviation Safety", "R&D", "Data",
        "Analytics", "ILS", "Integrated Logistic Support", "Eurofighter", "A400M", "MRTT"
    ]

    found = []
    text_lower = text.lower()
    for kw in keywords:
        pattern = r'\b' + re.escape(kw.lower()) + r'\b'
        matches = len(re.findall(pattern, text_lower))
        if matches > 0:
            found.append((kw, matches))
    return sorted(found, key=lambda x: x[1], reverse=True)

def main():
    print("=========================================")
    print("   SIMULADOR DE PARSEO ATS (ATS PARSER)  ")
    print("=========================================\n")

    # 1. Contact Information Extraction
    profile = load_json("sections/profile/data.json")
    header = load_json("sections/header/data.json")

    contacts = {}
    if profile:
        contacts['name'] = profile.get('name')
        contacts['email'] = profile.get('email')
        contacts['phone'] = profile.get('phone')
        contacts['location'] = profile.get('location')
        contacts['linkedin'] = profile.get('linkedin')
    elif header:
        contacts['name'] = header.get('name')
        contacts['email'] = header.get('email')
        contacts['phone'] = header.get('phone')
        contacts['location'] = header.get('location')
        contacts['linkedin'] = header.get('linkedin')

    print("--- 1. INFORMACIÓN DE CONTACTO DETECTADA ---")
    for k, v in contacts.items():
        print(f"  [{k.upper()}]: {v}")
    print()

    # 2. Summary Extraction
    about = load_json("sections/about/data.json")
    summary = about.get('description') if about else ""
    print("--- 2. RESUMEN PROFESIONAL DETECTADO ---")
    print(f"  {summary}\n")

    # 3. Work Experience Extraction
    experience_data = load_json("sections/experience/data.json")
    experiences = experience_data.get('experience', []) if experience_data else []

    print("--- 3. EXPERIENCIA LABORAL DETECTADA ---")
    exp_text_for_kw = ""
    for idx, exp in enumerate(experiences, 1):
        role = exp.get('role')
        company = exp.get('company')
        dates = exp.get('dates')
        desc = exp.get('description')
        tags = exp.get('tags')

        print(f"  Puesto {idx}: {role}")
        print(f"    Empresa: {company}")
        print(f"    Período: {dates}")
        print(f"    Descripción: {desc[:120]}...")
        print(f"    Palabras Clave: {tags}")
        print()

        exp_text_for_kw += f" {role} {company} {desc} {tags}"

    # 4. Education Extraction
    education_data = load_json("sections/education/data.json")
    educations = education_data.get('education', []) if education_data else []

    print("--- 4. EDUCACIÓN DETECTADA ---")
    edu_text_for_kw = ""
    for idx, edu in enumerate(educations, 1):
        degree = edu.get('degree')
        school = edu.get('school')
        year = edu.get('year')
        tags = edu.get('tags')
        print(f"  Estudio {idx}: {degree}")
        print(f"    Institución: {school}")
        print(f"    Año: {year}")
        print(f"    Etiquetas: {tags}")
        print()
        edu_text_for_kw += f" {degree} {school} {tags}"

    # 5. Skills & Languages Extraction
    skills_data = load_json("sections/methods-tools/data.json")
    skills = skills_data.get('skills', []) if skills_data else []

    print("--- 5. HABILIDADES (TECNOLOGÍAS Y METODOLOGÍAS) ---")
    skills_text_for_kw = ""
    for cat in skills:
        category = cat.get('category')
        items = cat.get('items', [])
        print(f"  Categoría [{category}]: {', '.join(items)}")
        skills_text_for_kw += f" {category} " + " ".join(items)
    print()

    languages_data = load_json("sections/languages/data.json")
    languages = languages_data.get('languages', []) if languages_data else []

    print("--- 6. IDIOMAS DETECTADOS ---")
    for lang in languages:
        name = lang.get('name')
        level = lang.get('level')
        code = lang.get('code')
        print(f"  - {name}: {level} ({code})")
    print()

    # Keyword analysis on reconstructed text
    full_text = f"{summary} {exp_text_for_kw} {edu_text_for_kw} {skills_text_for_kw}"
    keywords_found = analyze_keywords(full_text)

    print("--- 7. ANÁLISIS DE PALABRAS CLAVE (DENSIDAD) ---")
    for kw, count in keywords_found:
        print(f"  - '{kw}': {count} veces")
    print()

    # 8. ATS Compatibility Assessment & Diagnostics
    print("--- 8. DIAGNÓSTICO DE COMPATIBILIDAD ---")
    warnings = []

    if profile and profile.get('photo'):
        warnings.append("Contiene imágenes/fotos (photo.svg). Algunos ATS obsoletos no procesan bien PDFs con imágenes o intentan leerlas mediante OCR, lo que puede causar saltos de línea incorrectos.")

    warnings.append("Estructura de doble columna (Sidebar + Main) mediante CSS Grid. Al convertir el PDF a texto plano (método común de los ATS), las columnas pueden leerse horizontalmente de manera entrelazada (ej. mezclar la sección de idiomas con la experiencia laboral).")
    warnings.append("Sistemas de minimizado automático (is-minimized) e indicadores de overflow (+X items adicionales). Si hay roles u otros datos ocultados o colapsados visualmente en la versión final renderizada que se guarda en PDF, un ATS podría leer el contenido de la estructura HTML original si no se excluye, o directamente ignorarlos si no se renderizan al exportar.")
    warnings.append("Uso de iconos SVG de contacto. Los ATS los ignoran, pero es fundamental asegurarse de que haya texto alternativo o texto plano al lado (como ocurre aquí con los strings).")
    warnings.append("El CV combina etiquetas/textos en inglés (Professional Summary, Technical Product Owner, etc.) con datos e introducción en español (Madrid, España, etc.). Los ATS configurados para un único idioma de vacante pueden penalizar la densidad de palabras clave si hay mezcla.")

    print("  [ADVERTENCIAS]:")
    for idx, w in enumerate(warnings, 1):
        print(f"    {idx}. {w}")
    print()
    print("  [PUNTOS FUERTES]:")
    print("    1. Información estructurada con claridad: Roles, fechas (mes/año), empresas, y estudios bien delimitados.")
    print("    2. Alta densidad de palabras clave industriales altamente demandadas (Agile, Product Owner, Airbus, Python, SQL, Digital Twin).")
    print("    3. Ausencia de tablas complejas, gráficos flotantes o elementos no textuales para describir habilidades (ej. barras de porcentaje de habilidades son CSS puros y tienen texto legible).")
    print("=========================================")

if __name__ == "__main__":
    main()
