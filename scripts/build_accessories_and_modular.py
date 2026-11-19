import bpy
import bmesh
import math
from mathutils import Vector, Matrix

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_pbr_material(name, base_color, roughness=0.7, metallic=0.0):
    mat = bpy.data.materials.new(name=name)
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = base_color
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metallic
    return mat

# =============================================================================
# 1. GENERATE ACCESSORY: SANDBAGS (4 Leg Ballasts)
# =============================================================================
def build_sandbags():
    print("Generating accessory: Sandbags...")
    reset_scene()
    mat_sandbag = create_pbr_material("Mat_Sandbag", (0.12, 0.12, 0.14, 1.0), roughness=0.85, metallic=0.05)

    leg_coords = [
        (1.20, 1.20),
        (-1.20, 1.20),
        (1.20, -1.20),
        (-1.20, -1.20)
    ]

    sandbag_root = bpy.data.objects.new("Accessory_Sandbags", None)
    bpy.context.scene.collection.objects.link(sandbag_root)

    mesh_data = bpy.data.meshes.new("SandbagMesh")
    bm = bmesh.new()

    for lx, ly in leg_coords:
        angle = math.atan2(ly, lx)
        offset_dist = 0.08
        dx = math.cos(angle + math.pi / 2) * offset_dist
        dy = math.sin(angle + math.pi / 2) * offset_dist

        # Cylinder 1
        m1 = Matrix.Translation(Vector((lx + dx, ly + dy, 0.18)))
        bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.065, radius2=0.065, depth=0.34, matrix=m1)

        # Cylinder 2
        m2 = Matrix.Translation(Vector((lx - dx, ly - dy, 0.18)))
        bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.065, radius2=0.065, depth=0.34, matrix=m2)

        # Saddle wrap strap
        m_strap = Matrix.Translation(Vector((lx, ly, 0.32))) @ Matrix.Scale(0.18, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.10, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.04, 4, Vector((0, 0, 1)))
        bmesh.ops.create_cube(bm, size=1.0, matrix=m_strap)

    bm.to_mesh(mesh_data)
    bm.free()

    sandbags_obj = bpy.data.objects.new("Mesh_Sandbags", mesh_data)
    sandbags_obj.data.materials.append(mat_sandbag)
    sandbags_obj.parent = sandbag_root
    bpy.context.scene.collection.objects.link(sandbags_obj)

    bpy.ops.export_scene.gltf(
        filepath='public/models/accessory_sandbags.glb',
        export_format='GLB',
        use_selection=False
    )
    print("-> Exported public/models/accessory_sandbags.glb")

# =============================================================================
# 2. GENERATE ACCESSORY: WHEELED TRANSIT ROLLER BAG
# =============================================================================
def build_roller_bag():
    print("Generating accessory: Wheeled Roller Bag...")
    reset_scene()
    mat_roller = create_pbr_material("Mat_RollerBag", (0.08, 0.08, 0.10, 1.0), roughness=0.7, metallic=0.1)
    mat_accent = create_pbr_material("Mat_RollerAccent", (0.95, 0.65, 0.15, 1.0), roughness=0.5, metallic=0.1)
    mat_wheel = create_pbr_material("Mat_Wheel", (0.03, 0.03, 0.03, 1.0), roughness=0.6, metallic=0.2)

    bag_root = bpy.data.objects.new("Accessory_RollerBag", None)
    bpy.context.scene.collection.objects.link(bag_root)

    bx, by = 1.62, -0.65

    # Main Body Box
    bm_body = bmesh.new()
    m_body = Matrix.Translation(Vector((bx, by, 0.72))) @ Matrix.Scale(0.32, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.30, 4, Vector((0, 1, 0))) @ Matrix.Scale(1.36, 4, Vector((0, 0, 1)))
    bmesh.ops.create_cube(bm_body, size=1.0, matrix=m_body)
    mesh_body = bpy.data.meshes.new("RollerBag_Body")
    bm_body.to_mesh(mesh_body)
    bm_body.free()
    obj_body = bpy.data.objects.new("Mesh_RollerBag_Body", mesh_body)
    obj_body.data.materials.append(mat_roller)
    obj_body.parent = bag_root
    bpy.context.scene.collection.objects.link(obj_body)

    # Accent Stripe & Front Pouch
    bm_accent = bmesh.new()
    m_pouch = Matrix.Translation(Vector((bx + 0.17, by, 0.65))) @ Matrix.Scale(0.04, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.24, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.60, 4, Vector((0, 0, 1)))
    bmesh.ops.create_cube(bm_accent, size=1.0, matrix=m_pouch)

    m_stripe = Matrix.Translation(Vector((bx, by, 1.15))) @ Matrix.Scale(0.325, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.305, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.06, 4, Vector((0, 0, 1)))
    bmesh.ops.create_cube(bm_accent, size=1.0, matrix=m_stripe)

    mesh_accent = bpy.data.meshes.new("RollerBag_Accent")
    bm_accent.to_mesh(mesh_accent)
    bm_accent.free()
    obj_accent = bpy.data.objects.new("Mesh_RollerBag_Accent", mesh_accent)
    obj_accent.data.materials.append(mat_accent)
    obj_accent.parent = bag_root
    bpy.context.scene.collection.objects.link(obj_accent)

    # Bottom Wheels
    bm_wheels = bmesh.new()
    wheel_z = 0.04
    for wy in [by - 0.11, by + 0.11]:
        m_w = Matrix.Translation(Vector((bx - 0.14, wy, wheel_z))) @ Matrix.Rotation(math.pi / 2, 4, 'Y')
        bmesh.ops.create_cone(bm_wheels, cap_ends=True, segments=12, radius1=0.04, radius2=0.04, depth=0.035, matrix=m_w)
    mesh_wheels = bpy.data.meshes.new("RollerBag_Wheels")
    bm_wheels.to_mesh(mesh_wheels)
    bm_wheels.free()
    obj_wheels = bpy.data.objects.new("Mesh_RollerBag_Wheels", mesh_wheels)
    obj_wheels.data.materials.append(mat_wheel)
    obj_wheels.parent = bag_root
    bpy.context.scene.collection.objects.link(obj_wheels)

    bpy.ops.export_scene.gltf(
        filepath='public/models/accessory_wheelbag.glb',
        export_format='GLB',
        use_selection=False
    )
    print("-> Exported public/models/accessory_wheelbag.glb")

# =============================================================================
# 3. GENERATE ACCESSORY: SPIRAL EARTH STAKES & GUY LINES
# =============================================================================
def build_stakes():
    print("Generating accessory: Stakes & Guy Ropes...")
    reset_scene()
    mat_stake = create_pbr_material("Mat_ZincStake", (0.75, 0.77, 0.80, 1.0), roughness=0.3, metallic=0.85)
    mat_guyrope = create_pbr_material("Mat_GuyRope", (0.95, 0.45, 0.05, 1.0), roughness=0.6, metallic=0.0)

    stakes_root = bpy.data.objects.new("Accessory_Stakes", None)
    bpy.context.scene.collection.objects.link(stakes_root)

    leg_coords = [
        (1.20, 1.20),
        (-1.20, 1.20),
        (1.20, -1.20),
        (-1.20, -1.20)
    ]

    bm_stakes = bmesh.new()
    bm_ropes = bmesh.new()

    stake_distance = 1.95
    canopy_attach_z = 1.35

    for lx, ly in leg_coords:
        sx = math.copysign(stake_distance, lx)
        sy = math.copysign(stake_distance, ly)

        # Steel Stake peg
        axis_rot = Vector((-ly, lx, 0)).normalized()
        m_stake = Matrix.Translation(Vector((sx, sy, 0.08))) @ Matrix.Rotation(0.35, 4, axis_rot)
        bmesh.ops.create_cone(bm_stakes, cap_ends=True, segments=10, radius1=0.016, radius2=0.008, depth=0.22, matrix=m_stake)

        # Stake ring
        m_ring = Matrix.Translation(Vector((sx, sy, 0.18)))
        bmesh.ops.create_cone(bm_stakes, cap_ends=True, segments=10, radius1=0.024, radius2=0.024, depth=0.012, matrix=m_ring)

        # High-strength guy line tube
        p_start = Vector((lx, ly, canopy_attach_z))
        p_end = Vector((sx, sy, 0.14))
        diff = p_end - p_start
        length = diff.length
        center = (p_start + p_end) / 2.0

        rot_quat = Vector((0, 0, 1)).rotation_difference(diff)
        mat_rope = Matrix.Translation(center) @ rot_quat.to_matrix().to_4x4()
        bmesh.ops.create_cone(bm_ropes, cap_ends=True, segments=8, radius1=0.004, radius2=0.004, depth=length, matrix=mat_rope)

    mesh_stakes = bpy.data.meshes.new("StakesMesh")
    bm_stakes.to_mesh(mesh_stakes)
    bm_stakes.free()
    obj_stakes = bpy.data.objects.new("Mesh_Stakes", mesh_stakes)
    obj_stakes.data.materials.append(mat_stake)
    obj_stakes.parent = stakes_root
    bpy.context.scene.collection.objects.link(obj_stakes)

    mesh_ropes = bpy.data.meshes.new("GuyRopesMesh")
    bm_ropes.to_mesh(mesh_ropes)
    bm_ropes.free()
    obj_ropes = bpy.data.objects.new("Mesh_GuyRopes", mesh_ropes)
    obj_ropes.data.materials.append(mat_guyrope)
    obj_ropes.parent = stakes_root
    bpy.context.scene.collection.objects.link(obj_ropes)

    bpy.ops.export_scene.gltf(
        filepath='public/models/accessory_stakes.glb',
        export_format='GLB',
        use_selection=False
    )
    print("-> Exported public/models/accessory_stakes.glb")

# =============================================================================
# 4. GENERATE 1.8M ARCHITECTURAL HUMAN SCALE MANNEQUIN
# =============================================================================
def build_mannequin():
    print("Generating 1.8m Human Scale Mannequin...")
    reset_scene()
    mat_mannequin = create_pbr_material("Mat_Mannequin", (0.88, 0.90, 0.94, 1.0), roughness=0.4, metallic=0.15)

    man_root = bpy.data.objects.new("Human_Scale_1_8m", None)
    bpy.context.scene.collection.objects.link(man_root)

    mx, my = 0.85, 1.45
    bm_man = bmesh.new()

    # Head (1.70m)
    m_head = Matrix.Translation(Vector((mx, my, 1.70))) @ Matrix.Scale(0.10, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.11, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.12, 4, Vector((0, 0, 1)))
    bmesh.ops.create_uvsphere(bm_man, u_segments=16, v_segments=12, radius=1.0, matrix=m_head)

    # Torso
    m_torso = Matrix.Translation(Vector((mx, my, 1.25))) @ Matrix.Scale(0.24, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.14, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.48, 4, Vector((0, 0, 1)))
    bmesh.ops.create_cube(bm_man, size=1.0, matrix=m_torso)

    # Pelvis
    m_pelvis = Matrix.Translation(Vector((mx, my, 0.95))) @ Matrix.Scale(0.20, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.13, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.16, 4, Vector((0, 0, 1)))
    bmesh.ops.create_cube(bm_man, size=1.0, matrix=m_pelvis)

    # Legs
    for leg_x in [-0.07, 0.07]:
        m_leg = Matrix.Translation(Vector((mx + leg_x, my, 0.48))) @ Matrix.Scale(0.07, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.08, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.85, 4, Vector((0, 0, 1)))
        bmesh.ops.create_cube(bm_man, size=1.0, matrix=m_leg)
        m_foot = Matrix.Translation(Vector((mx + leg_x, my + 0.04, 0.03))) @ Matrix.Scale(0.06, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.16, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.05, 4, Vector((0, 0, 1)))
        bmesh.ops.create_cube(bm_man, size=1.0, matrix=m_foot)

    # Arms
    for arm_x, arm_angle in [(-0.16, 0.05), (0.16, -0.05)]:
        m_arm = Matrix.Translation(Vector((mx + arm_x, my, 1.15))) @ Matrix.Rotation(arm_angle, 4, 'Y') @ Matrix.Scale(0.05, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.05, 4, Vector((0, 1, 0))) @ Matrix.Scale(0.65, 4, Vector((0, 0, 1)))
        bmesh.ops.create_cube(bm_man, size=1.0, matrix=m_arm)

    mesh_man = bpy.data.meshes.new("MannequinMesh")
    bm_man.to_mesh(mesh_man)
    bm_man.free()

    obj_man = bpy.data.objects.new("Mesh_Human_Scale", mesh_man)
    obj_man.data.materials.append(mat_mannequin)
    obj_man.parent = man_root
    bpy.context.scene.collection.objects.link(obj_man)

    bpy.ops.export_scene.gltf(
        filepath='public/models/scale_mannequin.glb',
        export_format='GLB',
        use_selection=False
    )
    print("-> Exported public/models/scale_mannequin.glb")

# =============================================================================
# 5. GENERATE ACCESSORY: BACKDROP WALL
# =============================================================================
def build_backwall():
    print("Generating accessory: Backdrop Wall...")
    reset_scene()
    mat_backwall = create_pbr_material("Mat_BackWall", (0.15, 0.18, 0.22, 1.0), roughness=0.8, metallic=0.0)

    wall_root = bpy.data.objects.new("Accessory_BackWall", None)
    bpy.context.scene.collection.objects.link(wall_root)

    bm_wall = bmesh.new()
    m_wall = Matrix.Translation(Vector((0.0, -1.20, 0.70))) @ Matrix.Scale(2.38, 4, Vector((1, 0, 0))) @ Matrix.Scale(0.015, 4, Vector((0, 1, 0))) @ Matrix.Scale(1.36, 4, Vector((0, 0, 1)))
    bmesh.ops.create_cube(bm_wall, size=1.0, matrix=m_wall)

    mesh_wall = bpy.data.meshes.new("BackWallMesh")
    bm_wall.to_mesh(mesh_wall)
    bm_wall.free()

    obj_wall = bpy.data.objects.new("Mesh_BackWall", mesh_wall)
    obj_wall.data.materials.append(mat_backwall)
    obj_wall.parent = wall_root
    bpy.context.scene.collection.objects.link(obj_wall)

    bpy.ops.export_scene.gltf(
        filepath='public/models/accessory_backwall.glb',
        export_format='GLB',
        use_selection=False
    )
    print("-> Exported public/models/accessory_backwall.glb")

if __name__ == '__main__':
    build_sandbags()
    build_roller_bag()
    build_stakes()
    build_mannequin()
    build_backwall()
    print("ALL ASSETS CREATED SUCCESSFULLY!")
