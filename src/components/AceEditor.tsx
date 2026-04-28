import ReactAceModule from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-dracula';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-tomorrow_night';

// react-ace CJS/ESM interop: the default import may resolve to the
// module object { default: ReactAce, split, diff } instead of the component.
const AceEditor = (
  'default' in ReactAceModule ? ReactAceModule.default : ReactAceModule
) as typeof ReactAceModule;

export default AceEditor;
