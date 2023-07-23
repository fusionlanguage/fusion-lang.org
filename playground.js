import { CiParser, CiProgram, CiSystem } from "./cito.js";

const editor = ace.edit("editor-ci", {
		theme: "ace/theme/monokai",
		mode: "ace/mode/csharp",
		showPrintMargin: false,
		//readOnly: true
	});

class PlaygroundParser extends CiParser
{
	reportError(message)
	{
		this.annotations.push({ row: this.line - 1, column: this.column - 1, type: "error", text: message});
		// editor.session.addMarker(new ace.Range(this.line - 1, this.tokenColumn - 1, this.line - 1, this.column - 1), "ace_error-marker", "text", true);
	}
}

// editor.session.addMarker(new Range(0, 14, 0, 16), "ace_error-marker", "text", true);
//editor.session.setAnnotations([{ row: 0, column: 1, text: "foobar", type: "error" }]);

function transpile()
{
//	for (const markerId of Object.keys(editor.session.getMarkers()))
//		editor.session.removeMarker(markerId);
	const input = new TextEncoder().encode(editor.session.doc.getValue());
	const system = CiSystem.new();
	const parser = new PlaygroundParser();
	parser.program = new CiProgram();
	parser.program.parent = system;
	parser.program.system = system;
	parser.annotations = [];
	parser.parse("foo.ci", input, input.length);
	editor.session.setAnnotations(parser.annotations);
}

editor.session.on("change", transpile);
