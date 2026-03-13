import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

  // Registrar el comando
  context.subscriptions.push(
    vscode.commands.registerCommand('trinity.wrapWithSignalBuilder', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      let range: vscode.Range = editor.selection;

      if (editor.selection.isEmpty) {
        const detected = getWidgetRange(editor.document, editor.selection.active);
        if (!detected) return;
        range = detected;
      }

      const selectedText = editor.document.getText(range);
      const line = editor.document.lineAt(range.start.line);
      const indent = line.text.match(/^\s*/)?.[0] || '';

      const snippet = new vscode.SnippetString(
        `SignalBuilder<\${2:StateType}>(\n` +
        `${indent}  signal: \${3:mySignal},\n` +
        `${indent}  builder: (context, \${4:state}) {\n` +
        `${indent}    return ${selectedText.trim()};\n` +
        `${indent}  },\n` +
        `${indent})`
      );

      await editor.edit((editBuilder: vscode.TextEditorEdit) => {
        editBuilder.delete(range);
      });

      await editor.insertSnippet(snippet);
    }),
    vscode.commands.registerCommand('trinity.wrapWithNodeProvider', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      let range: vscode.Range = editor.selection;

      if (editor.selection.isEmpty) {
        const detected = getWidgetRange(editor.document, editor.selection.active);
        if (!detected) return;
        range = detected;
      }

      const selectedText = editor.document.getText(range);
      const line = editor.document.lineAt(range.start.line);
      const indent = line.text.match(/^\s*/)?.[0] || '';

      const snippet = new vscode.SnippetString(
        `NodeProvider(\n` +
        `${indent}  create: () => \${1:MyNode}(),\n` +
        `${indent}  child: ${selectedText.trim()},\n` +
        `${indent})`
      );

      await editor.edit((editBuilder: vscode.TextEditorEdit) => {
        editBuilder.delete(range);
      });

      await editor.insertSnippet(snippet);
    }),
    vscode.commands.registerCommand('trinity.wrapWithSignalListener', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      let range: vscode.Range = editor.selection;

      if (editor.selection.isEmpty) {
        const detected = getWidgetRange(editor.document, editor.selection.active);
        if (!detected) return;
        range = detected;
      }

      const selectedText = editor.document.getText(range);
      const line = editor.document.lineAt(range.start.line);
      const indent = line.text.match(/^\s*/)?.[0] || '';

      const snippet = new vscode.SnippetString(
        `SignalListener<\${1:StateType}>(\n` +
        `${indent}  signal: node.\${2:mySignal},\n` +
        `${indent}  listener: (context, \${2:state}) {\n` +
        `${indent}    \${3:// TODO: implement listener}\n` +
        `${indent}  },\n` +
        `${indent}  child: ${selectedText.trim()},\n` +
        `${indent})`
      );

      await editor.edit((editBuilder: vscode.TextEditorEdit) => {
        editBuilder.delete(range);
      });

      await editor.insertSnippet(snippet);
    })
  );

  // Code Action Provider — el menú contextual
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider('dart', new TrinityCodeActionProvider(), {
      providedCodeActionKinds: [vscode.CodeActionKind.Refactor]
    })
  );
}

class TrinityCodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.CodeAction[] {

    const actions: vscode.CodeAction[] = [];

    const wrapSignal = new vscode.CodeAction(
      'Wrap with SignalBuilder',
      vscode.CodeActionKind.Refactor
    );
    wrapSignal.command = {
      command: 'trinity.wrapWithSignalBuilder',
      title: 'Wrap with SignalBuilder'
    };

    const wrapNode = new vscode.CodeAction(
      'Wrap with NodeProvider',
      vscode.CodeActionKind.Refactor
    );
    wrapNode.command = {
      command: 'trinity.wrapWithNodeProvider',
      title: 'Wrap with NodeProvider'
    };

    const wrapListener = new vscode.CodeAction(
      'Wrap with SignalListener',
      vscode.CodeActionKind.Refactor
    );
    wrapListener.command = {
      command: 'trinity.wrapWithSignalListener',
      title: 'Wrap with SignalListener'
    };

    actions.push(wrapSignal, wrapNode, wrapListener);
    return actions;
  }

}

export function deactivate() { }

function getWidgetRange(document: vscode.TextDocument, position: vscode.Position): vscode.Range | null {
  const text = document.getText();
  const line = document.lineAt(position.line).text;

  // Buscar un widget (PascalCase seguido de paréntesis) en la línea actual
  const widgetMatch = line.match(/([A-Z][a-zA-Z0-9_]*)\s*\(/);
  if (!widgetMatch || widgetMatch.index === undefined) return null;

  // Offset absoluto del inicio del nombre del widget
  const lineOffset = document.offsetAt(new vscode.Position(position.line, 0));
  const nameStart = lineOffset + widgetMatch.index;
  const parenStart = lineOffset + widgetMatch.index + widgetMatch[0].length - 1;

  // Encontrar el cierre del paréntesis
  let depth = 1;
  let parenEnd = parenStart + 1;
  while (parenEnd < text.length && depth > 0) {
    if (text[parenEnd] === '(') depth++;
    if (text[parenEnd] === ')') depth--;
    parenEnd++;
  }

  if (depth !== 0) return null;

  return new vscode.Range(
    document.positionAt(nameStart),
    document.positionAt(parenEnd)
  );
}