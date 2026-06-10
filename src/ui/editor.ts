// ── CodeMirror editor factory ──

export function createEditor(
  el: HTMLElement,
  readOnly: boolean,
  placeholder: string,
): CodeMirror.Editor {
  return CodeMirror(el, {
    mode: { name: 'javascript', json: true },
    theme: 'jsonabc',
    readOnly: readOnly ? 'nocursor' : false,
    placeholder,
    lineNumbers: true,
    lineWrapping: true,
    tabSize: 2,
    indentUnit: 2,
    indentWithTabs: false,
    smartIndent: true,
    matchBrackets: true,
    autoCloseBrackets: false,
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    extraKeys: {
      'Ctrl-S': () => {},
      'Cmd-S': () => {},
    },
  });
}
