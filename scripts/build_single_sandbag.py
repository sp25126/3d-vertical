import bpy

# Purge default scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Build a single high-detail saddle sandbag centered at (0, 0, 0)
# Designed to wrap snugly around a canopy corner leg pole
cyl_mat = bpy.data.materials.new(name='SandbagFabric')
cyl_mat.use_nodes = True
bsdf = cyl_mat.node_tree.nodes.get('Principled BSDF')
if bsdf:
    bsdf.inputs['Base Color'].default_value = (0.10, 0.10, 0.12, 1.0) # 1680D Ballistic Charcoal Black
    bsdf.inputs['Roughness'].default_value = 0.85
    bsdf.inputs['Metallic'].default_value = 0.02

# Dual saddle cylinders on either side of the leg
bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=0.28, vertices=16, location=(-0.05, 0.05, 0.14))
cyl1 = bpy.context.active_object
cyl1.data.materials.append(cyl_mat)

bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=0.28, vertices=16, location=(0.05, -0.05, 0.14))
cyl2 = bpy.context.active_object
cyl2.data.materials.append(cyl_mat)

# Velcro wrap band connecting around the leg
band_mat = bpy.data.materials.new(name='VelcroBand')
band_mat.use_nodes = True
b_bsdf = band_mat.node_tree.nodes.get('Principled BSDF')
if b_bsdf:
    b_bsdf.inputs['Base Color'].default_value = (0.18, 0.18, 0.20, 1.0)
    b_bsdf.inputs['Roughness'].default_value = 0.95

bpy.ops.mesh.primitive_cylinder_add(radius=0.052, depth=0.06, vertices=16, location=(0, 0, 0.16))
band = bpy.context.active_object
band.data.materials.append(band_mat)

# Heavy-duty webbing haul loop handle
bpy.ops.mesh.primitive_torus_add(major_radius=0.035, minor_radius=0.007, location=(0, 0, 0.285))
handle = bpy.context.active_object
handle.rotation_euler = (0, 1.5708, 0.785)
handle.data.materials.append(band_mat)

# Join into single modular object
for obj in [cyl1, cyl2, band, handle]:
    obj.select_set(True)
bpy.context.view_layer.objects.active = cyl1
bpy.ops.object.join()
cyl1.name = 'SandbagUnit'

# Export single modular sandbag asset
bpy.ops.export_scene.gltf(
    filepath='public/models/accessory_sandbag_single.glb',
    export_format='GLB',
    use_selection=True
)
print('Successfully exported public/models/accessory_sandbag_single.glb')
