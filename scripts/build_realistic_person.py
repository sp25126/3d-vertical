import bpy
import bmesh
import math
from mathutils import Vector, Matrix

# Reset
bpy.ops.wm.read_factory_settings(use_empty=True)

def create_pbr(name, color, roughness=0.6, metallic=0.0):
    mat = bpy.data.materials.new(name=name)
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metallic
    return mat

mat_skin = create_pbr("Skin_Mat", (0.87, 0.72, 0.62, 1.0), roughness=0.55)
mat_hair = create_pbr("Hair_Mat", (0.18, 0.12, 0.08, 1.0), roughness=0.8)
mat_shirt = create_pbr("Shirt_Mat", (0.15, 0.28, 0.45, 1.0), roughness=0.7) # Navy blue polo
mat_pants = create_pbr("Pants_Mat", (0.18, 0.22, 0.28, 1.0), roughness=0.75) # Charcoal denim
mat_shoes = create_pbr("Shoes_Mat", (0.92, 0.92, 0.92, 1.0), roughness=0.4, metallic=0.05) # White sneakers
mat_sole = create_pbr("Sole_Mat", (0.2, 0.2, 0.2, 1.0), roughness=0.8)

root = bpy.data.objects.new("Person_1_80m", None)
bpy.context.scene.collection.objects.link(root)

# Total height is exactly 1.80m (5' 11")
# Coordinate origin: feet on ground at Z = 0

# 1. Shoes (Z: 0 to 0.08m)
bm_shoes = bmesh.new()
for lx in [-0.10, 0.10]:
    # Sole
    m_sole = Matrix.Translation(Vector((lx, 0.04, 0.015))) @ Matrix.Scale(0.09, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.26, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.03, 4, Vector((0, 0, 1)))
    bmesh.ops.create_cube(bm_shoes, size=1.0, matrix=m_sole)
    # Upper sneaker
    m_upper = Matrix.Translation(Vector((lx, 0.03, 0.05))) @ Matrix.Scale(0.085, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.24, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.05, 4, Vector((0, 0, 1)))
    bmesh.ops.create_cube(bm_shoes, size=1.0, matrix=m_upper)

mesh_shoes = bpy.data.meshes.new("ShoesMesh")
bm_shoes.to_mesh(mesh_shoes)
bm_shoes.free()
obj_shoes = bpy.data.objects.new("Person_Shoes", mesh_shoes)
obj_shoes.data.materials.append(mat_shoes)
obj_shoes.parent = root
bpy.context.scene.collection.objects.link(obj_shoes)

# 2. Pants / Legs (Z: 0.07 to 0.98m)
bm_pants = bmesh.new()
# Legs
for lx in [-0.10, 0.10]:
    m_leg = Matrix.Translation(Vector((lx, 0.0, 0.50))) @ Matrix.Scale(0.085, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.095, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.86, 4, Vector((0, 0, 1)))
    bmesh.ops.create_cube(bm_pants, size=1.0, matrix=m_leg)
# Pelvis / Hips (Z: 0.88 to 1.02m)
m_pelvis = Matrix.Translation(Vector((0.0, 0.0, 0.95))) @ Matrix.Scale(0.27, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.18, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.18, 4, Vector((0, 0, 1)))
bmesh.ops.create_cube(bm_pants, size=1.0, matrix=m_pelvis)

mesh_pants = bpy.data.meshes.new("PantsMesh")
bm_pants.to_mesh(mesh_pants)
bm_pants.free()
obj_pants = bpy.data.objects.new("Person_Pants", mesh_pants)
obj_pants.data.materials.append(mat_pants)
obj_pants.parent = root
bpy.context.scene.collection.objects.link(obj_pants)

# 3. Torso / Shirt (Z: 1.02 to 1.54m)
bm_shirt = bmesh.new()
# Upper chest & abdomen
m_torso = Matrix.Translation(Vector((0.0, 0.0, 1.28))) @ Matrix.Scale(0.32, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.20, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.52, 4, Vector((0, 0, 1)))
bmesh.ops.create_cube(bm_shirt, size=1.0, matrix=m_torso)
# Shoulders
for sx, ang in [(-0.18, 0.1), (0.18, -0.1)]:
    m_sh = Matrix.Translation(Vector((sx, 0.0, 1.48))) @ Matrix.Rotation(ang, 4, 'Y') @ Matrix.Scale(0.12, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.14, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.12, 4, Vector((0, 0, 1)))
    bmesh.ops.create_cube(bm_shirt, size=1.0, matrix=m_sh)
    # Short sleeves
    m_sl = Matrix.Translation(Vector((sx * 1.15, 0.0, 1.38))) @ Matrix.Scale(0.09, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.10, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.18, 4, Vector((0, 0, 1)))
    bmesh.ops.create_cube(bm_shirt, size=1.0, matrix=m_sl)

mesh_shirt = bpy.data.meshes.new("ShirtMesh")
bm_shirt.to_mesh(mesh_shirt)
bm_shirt.free()
obj_shirt = bpy.data.objects.new("Person_Shirt", mesh_shirt)
obj_shirt.data.materials.append(mat_shirt)
obj_shirt.parent = root
bpy.context.scene.collection.objects.link(obj_shirt)

# 4. Arms & Hands (Skin)
bm_skin = bmesh.new()
# Forearms & hands
for ax in [-0.21, 0.21]:
    m_arm = Matrix.Translation(Vector((ax, 0.0, 1.15))) @ Matrix.Scale(0.065, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.07, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.32, 4, Vector((0, 0, 1)))
    bmesh.ops.create_cube(bm_skin, size=1.0, matrix=m_arm)
    # Hand
    m_hand = Matrix.Translation(Vector((ax, 0.01, 0.96))) @ Matrix.Scale(0.05, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.07, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.09, 4, Vector((0, 0, 1)))
    bmesh.ops.create_cube(bm_skin, size=1.0, matrix=m_hand)

# Neck
m_neck = Matrix.Translation(Vector((0.0, 0.0, 1.57)))
bmesh.ops.create_cone(bm_skin, cap_ends=True, segments=12, radius1=0.06, radius2=0.055, depth=0.08, matrix=m_neck)

# Head & Face (Z: 1.60 to 1.78m)
m_head = Matrix.Translation(Vector((0.0, 0.01, 1.68))) @ Matrix.Scale(0.13, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.15, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.18, 4, Vector((0, 0, 1)))
bmesh.ops.create_uvsphere(bm_skin, u_segments=16, v_segments=12, radius=0.9, matrix=m_head)

mesh_skin = bpy.data.meshes.new("SkinMesh")
bm_skin.to_mesh(mesh_skin)
bm_skin.free()
obj_skin = bpy.data.objects.new("Person_Skin", mesh_skin)
obj_skin.data.materials.append(mat_skin)
obj_skin.parent = root
bpy.context.scene.collection.objects.link(obj_skin)

# 5. Hair (Z: 1.72 to 1.80m) - Apex at exactly 1.80m
bm_hair = bmesh.new()
m_hair = Matrix.Translation(Vector((0.0, -0.01, 1.74))) @ Matrix.Scale(0.135, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.155, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.11, 4, Vector((0, 0, 1)))
bmesh.ops.create_uvsphere(bm_hair, u_segments=16, v_segments=12, radius=0.9, matrix=m_hair)
mesh_hair = bpy.data.meshes.new("HairMesh")
bm_hair.to_mesh(mesh_hair)
bm_hair.free()
obj_hair = bpy.data.objects.new("Person_Hair", mesh_hair)
obj_hair.data.materials.append(mat_hair)
obj_hair.parent = root
bpy.context.scene.collection.objects.link(obj_hair)

# Normalize exact total height to 1.80m (5' 11")
bpy.context.view_layer.update()
bbox = [root.matrix_world @ Vector(c) for obj in [obj_shoes, obj_pants, obj_shirt, obj_skin, obj_hair] for c in obj.bound_box]
min_z = min(v.z for v in bbox)
max_z = max(v.z for v in bbox)
curr_h = max_z - min_z
scale_factor = 1.80 / curr_h
root.scale = Vector((scale_factor, scale_factor, scale_factor))
bpy.context.view_layer.update()

bbox_final = [root.matrix_world @ Vector(c) for obj in [obj_shoes, obj_pants, obj_shirt, obj_skin, obj_hair] for c in obj.bound_box]
final_h = max(v.z for v in bbox_final) - min(v.z for v in bbox_final)
print(f"Realistic Person Model Exact Height: {final_h:.3f} m (5 ft 11 in)")

# Export
bpy.ops.export_scene.gltf(
    filepath='public/models/scale_person.glb',
    export_format='GLB',
    use_selection=False
)
print("-> Exported public/models/scale_person.glb successfully!")
