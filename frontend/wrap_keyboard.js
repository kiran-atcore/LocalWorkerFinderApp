const fs = require('fs');

const files = [
  'src/app/CategoryList/[id].tsx',
  'src/app/WorkerProfileEdit/[id].tsx',
  'src/app/RadarMap/[id].tsx',
  'src/app/LocationSetUp/[id].tsx',
  'src/app/JobRoleForm/[id].tsx',
  'src/app/CustomerProfileEdit/[id].tsx',
  'src/app/BookingForm/[id].tsx',
  'src/app/AddReviewForm/[id].tsx',
  'src/app/(tabs)/chat.tsx',
  'src/app/(tabs)/home.tsx'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('<KeyboardAvoidingView')) {
      console.log('Already wrapped: ' + f);
      return;
  }
  
  // Add imports
  content = content.replace(/import {([^}]+)} from 'react-native';/, (match, p1) => {
    let imps = p1.split(',').map(s=>s.trim());
    if(!imps.includes('KeyboardAvoidingView')) imps.push('KeyboardAvoidingView');
    if(!imps.includes('Platform')) imps.push('Platform');
    return `import { ${imps.join(', ')} } from 'react-native';`;
  });

  let replaced = false;

  // Try SafeAreaView
  let regex = /return \(\s*<SafeAreaView([^>]*)>/g;
  let matches = [...content.matchAll(regex)];
  if (matches.length > 0) {
      content = content.replace(
        /return \(\s*<SafeAreaView([^>]*)>/g, 
        'return (\n    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === \'ios\' ? \'padding\' : \'height\'}>\n      <SafeAreaView$1>'
      );
      content = content.replace(
        /<\/SafeAreaView>\s*\);/g, 
        '</SafeAreaView>\n    </KeyboardAvoidingView>\n  );'
      );
      fs.writeFileSync(f, content, 'utf8');
      console.log('Wrapped SafeAreaView in ' + f);
      replaced = true;
  }
  
  if (!replaced) {
      regex = /return \(\s*<View([^>]*)>/g;
      matches = [...content.matchAll(regex)];
      if (matches.length > 0) {
          content = content.replace(
            /return \(\s*<View([^>]*)>/g, 
            'return (\n    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === \'ios\' ? \'padding\' : \'height\'}>\n      <View$1>'
          );
          content = content.replace(
            /<\/View>\s*\);/g, 
            '</View>\n    </KeyboardAvoidingView>\n  );'
          );
          fs.writeFileSync(f, content, 'utf8');
          console.log('Wrapped View in ' + f);
          replaced = true;
      }
  }

  if (!replaced) {
      regex = /return \(\s*<ScrollView([^>]*)>/g;
      matches = [...content.matchAll(regex)];
      if (matches.length > 0) {
          content = content.replace(
            /return \(\s*<ScrollView([^>]*)>/g, 
            'return (\n    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === \'ios\' ? \'padding\' : \'height\'}>\n      <ScrollView$1>'
          );
          content = content.replace(
            /<\/ScrollView>\s*\);/g, 
            '</ScrollView>\n    </KeyboardAvoidingView>\n  );'
          );
          fs.writeFileSync(f, content, 'utf8');
          console.log('Wrapped ScrollView in ' + f);
          replaced = true;
      }
  }
  
  if (!replaced) {
      console.log('Could not wrap ' + f);
  }
});
