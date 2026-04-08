import json

with open('/tmp/workflow_current.json') as f:
    data = json.load(f)

nodes = data['nodes']

# New schema fields for email marketing columns
new_schema_fields = [
    {"id": "correo_enviado", "displayName": "correo_enviado", "required": False,
     "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": True, "removed": False},
    {"id": "fecha_c1", "displayName": "fecha_c1", "required": False,
     "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": True, "removed": False},
    {"id": "fecha_c2", "displayName": "fecha_c2", "required": False,
     "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": True, "removed": False},
    {"id": "fecha_c3", "displayName": "fecha_c3", "required": False,
     "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": True, "removed": False},
    {"id": "estado_email", "displayName": "estado_email", "required": False,
     "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": True, "removed": False},
]

# New fields for Formatear Lead node
new_assignments = [
    {"id": "f8",  "name": "correo_enviado", "value": "0",      "type": "string"},
    {"id": "f9",  "name": "fecha_c1",       "value": "",       "type": "string"},
    {"id": "f10", "name": "fecha_c2",       "value": "",       "type": "string"},
    {"id": "f11", "name": "fecha_c3",       "value": "",       "type": "string"},
    {"id": "f12", "name": "estado_email",   "value": "activo", "type": "string"},
]

for n in nodes:
    # Add new fields to Formatear Lead
    if n['id'] == 'node-format':
        n['parameters']['assignments']['assignments'].extend(new_assignments)
        print("Updated Formatear Lead: added 5 new fields")

    # Add new columns to Sheets schema
    if n['id'] == 'node-sheets':
        n['parameters']['columns']['schema'].extend(new_schema_fields)
        print("Updated Google Sheets node: added new columns to schema")

data['nodes'] = nodes

with open('/tmp/workflow_updated.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("Saved!")
