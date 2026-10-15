"""Reproducible Cycles cocktail studio. Run with Blender --background --python ...
Arguments after --: --frames 0,60,119 or --frames all; --preview for small proofs.
"""
import bpy, math, os, sys, argparse
from mathutils import Vector

args = argparse.ArgumentParser()
args.add_argument('--frames', default='0,60,119')
args.add_argument('--preview', action='store_true')
args.add_argument('--cpu', action='store_true')
args.add_argument('--scene-only', action='store_true')
opts = args.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
OUT = os.path.join(ROOT, 'render-output', 'v2')
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24 if opts.preview else 64
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 12
scene.cycles.transmission_bounces = 10
scene.cycles.transparent_max_bounces = 8
scene.cycles.seed = 17
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = .045
scene.cycles.adaptive_min_samples = 16
scene.render.resolution_x = 1440
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 50 if opts.preview else 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.view_settings.view_transform = 'AgX'
scene.render.threads_mode = 'AUTO'
scene.render.threads = 14
# Use supported hardware when available, retain a deterministic CPU fallback.
try:
    if opts.cpu: raise RuntimeError('CPU requested')
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'ONEAPI'
    prefs.get_devices()
    available = [d for d in prefs.devices if d.type == 'ONEAPI']
    if available:
        for device in prefs.devices: device.use = device.type == 'ONEAPI'
        scene.cycles.device = 'GPU'
except Exception as error:
    print('Cycles CPU fallback:', error)

def material(name, color, rough=.3, metal=0, transmission=0, ior=1.45):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    p.inputs['Transmission Weight'].default_value = transmission
    p.inputs['IOR'].default_value = ior
    return m

glass = material('Fine crystal · 1.45 IOR', (.985,.99,1), .022, transmission=1)
liquid = material('Clear cocktail · 1.333 IOR', (.985,.98,.93), .012, transmission=1, ior=1.333)
metal = material('Brushed silver pick', (.64,.59,.48), .19, metal=1)
olive = material('Olive skin', (.28,.32,.065), .32)
nodes=olive.node_tree.nodes; links=olive.node_tree.links
noise=nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value=65
bump=nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.12; bump.inputs['Distance'].default_value=.025
ramp=nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].position=.2; ramp.color_ramp.elements[0].color=(.12,.17,.022,1); ramp.color_ramp.elements[1].position=.8; ramp.color_ramp.elements[1].color=(.34,.38,.09,1)
links.new(noise.outputs['Fac'],ramp.inputs['Fac']); links.new(ramp.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color'])
links.new(noise.outputs['Fac'], bump.inputs['Height']); links.new(bump.outputs['Normal'],nodes.get('Principled BSDF').inputs['Normal'])
pimento=material('Pimento', (.25,.032,.009), .4)
wine=material('Burgundy velvet', (.075,.008,.006), .68)
floor=material('Polished dark red studio', (.045,.008,.006), .26)
root=bpy.data.objects.new('Cocktail rotation axis',None); scene.collection.objects.link(root)

def lathe(name, profile, mat):
    vertices=[]; faces=[]; count=160
    for radius,z in profile:
        vertices.extend([(radius*math.cos(2*math.pi*j/count),radius*math.sin(2*math.pi*j/count),z) for j in range(count)])
    for i in range(len(profile)-1):
        for j in range(count):
            a=i*count+j; b=i*count+(j+1)%count
            faces.append((a,b,b+count,a+count))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj);obj.data.materials.append(mat);obj.parent=root
    for polygon in mesh.polygons:polygon.use_smooth=True
    sub=obj.modifiers.new('Optical smoothness','SUBSURF');sub.levels=2;sub.render_levels=2
    return obj

lathe('One-piece crystal coupe',[(0,.045),(.35,.045),(.85,.055),(1.02,.09),(1.05,.13),(1.01,.17),(.8,.2),(.3,.23),(.13,.3),(.075,.48),(.067,2.65),(.09,2.85),(.2,3.02),(.43,3.15),(.76,3.35),(1.08,3.65),(1.33,4.0),(1.48,4.38),(1.51,4.65),(1.51,4.75),(1.495,4.775),(1.473,4.75),(1.474,4.64),(1.44,4.38),(1.29,4.02),(1.04,3.69),(.72,3.41),(.41,3.22),(.18,3.13),(0,3.12)],glass)
lathe('Cocktail with meniscus',[(0,3.16),(.2,3.18),(.42,3.27),(.71,3.45),(1.02,3.73),(1.26,4.04),(1.39,4.35),(1.397,4.39),(1.37,4.375),(.9,4.37),(0,4.37)],liquid)

def sphere(name, location, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=location)
    obj=bpy.context.object;obj.name=name;obj.scale=scale;obj.data.materials.append(mat);obj.parent=root
    for p in obj.data.polygons:p.use_smooth=True
    return obj

start=Vector((-.7,-.08,3.75));end=Vector((1.72,-.08,5.25));axis=(end-start).normalized()
for t in [.3,.67]:
    pos=start.lerp(end,t)
    obj=sphere('Green olive',pos,(.29,.29,.39),olive)
    obj.rotation_euler=axis.to_track_quat('Z','Y').to_euler()
    tip=sphere('Pimento center',pos-axis*.355,(.11,.11,.042),pimento)
    tip.rotation_euler=obj.rotation_euler
def rod(name,a,b,radius,mat):
    delta=b-a
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=radius,depth=delta.length,location=(a+b)/2)
    o=bpy.context.object;o.name=name;o.rotation_euler=delta.to_track_quat('Z','Y').to_euler();o.data.materials.append(mat);o.parent=root
    for p in o.data.polygons:p.use_smooth=True
rod('Fine cocktail skewer',start,end,.018,metal)
sphere('Pick oval finial',end,(.095,.045,.15),metal)

# Seamless cyclorama avoids a hard horizon cutting across the stem.
sweep=[(-40,-.01),(2,-.01),(3,.02),(3.8,.2),(4.5,.65),(5,1.4),(5.2,2.5),(5.2,15)]
vertices=[(x,y,z) for y,z in sweep for x in [-40,40]]
faces=[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(sweep)-1)]
mesh=bpy.data.meshes.new('Seamless studio');mesh.from_pydata(vertices,[],faces);mesh.update()
backdrop=bpy.data.objects.new('Burgundy cyclorama',mesh);scene.collection.objects.link(backdrop);backdrop.data.materials.append(wine)
for p in mesh.polygons:p.use_smooth=True
sub=backdrop.modifiers.new('Soft curve','SUBSURF');sub.levels=2
scene.world.color=(.13,.08,.065)
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.22,.12,.09,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.22

def aim(obj,point):obj.rotation_euler=(Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()
def area(name,location,power,color,size,shape='DISK',size_y=None):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.shape=shape;data.size=size
    if size_y is not None:data.size_y=size_y
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=location;aim(obj,(0,0,2.9))
area('Left silk strip',(-3,-2,5.5),240,(1,.88,.72),.55,'RECTANGLE',5)
area('Right crystal rim',(3,1,4.5),330,(1,.94,.85),.45,'RECTANGLE',4)
area('Stem edge reflection',(-2,1,2),75,(1,.8,.6),.28,'RECTANGLE',3.5)
area('Softbox above',(-.5,0,7),110,(1,.9,.77),2.2)
area('Warm background wash',(-4,1,3),110,(1,.23,.08),3)
bpy.ops.object.camera_add(location=(0,-12.8,6.1))
camera=bpy.context.object;scene.camera=camera;camera.data.lens=42
camera.data.dof.use_dof=False
def pose(index):
    t=index/119
    smooth=t*t*(3-2*t)
    root.rotation_euler.z=-math.pi*smooth
    camera.location=(0,-12.8+7.2*smooth,6.1+.55*smooth)
    aim(camera,(0,0,2.65+1.35*smooth))
def frame(index):
    scene.frame_set(index+1)
    scene.render.filepath=os.path.join(OUT,('proof-' if opts.preview else 'frame-')+f'{index:03d}.png')
    if not opts.preview and os.path.exists(scene.render.filepath): return
    bpy.ops.render.render(write_still=True)
indices=range(120) if opts.frames=='all' else [int(i) for i in opts.frames.split(',')]
scene.frame_start=1;scene.frame_end=120;scene.render.fps=60
for i in range(120):
    pose(i)
    root.keyframe_insert(data_path='rotation_euler',frame=i+1)
    camera.keyframe_insert(data_path='location',frame=i+1)
    camera.keyframe_insert(data_path='rotation_euler',frame=i+1)
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'li-bar-cocktail.blend'))
if not opts.scene_only:
    for index in indices:frame(index)
