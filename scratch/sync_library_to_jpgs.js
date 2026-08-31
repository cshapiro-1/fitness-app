const fs = require('fs');
const path = require('path');

const libFile = path.join(__dirname, '..', 'src', 'lib', 'unifiedExerciseLibrary.ts');
let content = fs.readFileSync(libFile, 'utf8');

const mapping = {
  'incline_bench.svg': 'incline_bench.jpg',
  'flat_dumbbell_press.svg': 'flat_dumbbell_press.jpg',
  'push_up.svg': 'push_up.jpg',
  'barbell_row.svg': 'barbell_row.jpg',
  'lat_pulldown.svg': 'lat_pulldown.jpg',
  'pull_up.svg': 'pull_up.jpg',
  'face_pull.svg': 'face_pull.jpg',
  'bulgarian_split_squat.svg': 'bulgarian_split_squat.jpg',
  'leg_extension.svg': 'leg_extension.jpg',
  'leg_curl.svg': 'leg_curl.jpg',
  'standing_calf_raise.svg': 'standing_calf_raise.jpg',
  'hip_thrust.svg': 'hip_thrust.jpg',
  'romanian_deadlift.svg': 'romanian_deadlift.jpg',
  'overhead_press.svg': 'overhead_press.jpg',
  'lateral_raise.svg': 'lateral_raise.jpg',
  'bicep_curl.svg': 'bicep_curl.jpg',
  'hammer_curl.svg': 'hammer_curl.jpg',
  'tricep_pushdown.svg': 'tricep_pushdown.jpg',
  'plank.svg': 'plank.jpg',
  'back_hyperextension.svg': 'back_hyperextension.jpg',
  'ql_extension.svg': 'ql_extension.jpg',
  'chest_doorway_stretch.svg': 'chest_doorway_stretch.jpg',
  'band_pass_throughs.svg': 'band_pass_throughs.jpg',
  'lat_stretch.svg': 'lat_stretch.jpg',
  'childs_pose.svg': 'childs_pose.jpg',
  'neck_trap_stretch.svg': 'neck_trap_stretch.jpg',
  'cat_cow.svg': 'cat_cow.jpg',
  'foam_roll_thoracic.svg': 'foam_roll_thoracic.jpg',
  'thread_the_needle.svg': 'thread_the_needle.jpg',
  'standing_quad_stretch.svg': 'standing_quad_stretch.jpg',
  'frog_stretch.svg': 'frog_stretch.jpg',
  'figure4_stretch.svg': 'figure4_stretch.jpg',
  'hip_90_90.svg': 'hip_90_90.jpg',
  'hamstring_fold.svg': 'hamstring_fold.jpg',
  'butterfly_stretch.svg': 'butterfly_stretch.jpg',
  'calf_stretch.svg': 'calf_stretch.jpg',
  'shoulder_crossbody.svg': 'shoulder_crossbody.jpg',
  'sleeper_stretch.svg': 'sleeper_stretch.jpg',
  'tricep_stretch.svg': 'tricep_stretch.jpg',
  'bicep_stretch.svg': 'bicep_stretch.jpg',
  'wrist_mobility.svg': 'wrist_mobility.jpg',
  'cobra_stretch.svg': 'cobra_stretch.jpg',
  'ql_stretch.svg': 'ql_stretch.jpg',
  'supine_twist.svg': 'supine_twist.jpg',
  'worlds_greatest.svg': 'worlds_greatest.jpg'
};

for (const [svg, jpg] of Object.entries(mapping)) {
  content = content.replaceAll(svg, jpg);
}

fs.writeFileSync(libFile, content, 'utf8');
console.log('Successfully synchronized all diagramUrls in unifiedExerciseLibrary.ts to high-res 3D JPGs!');
