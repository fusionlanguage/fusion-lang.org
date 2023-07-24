import { CiParser, CiProgram, CiSystem, CiSema, CiSemaHost } from "./cito.js";

const editor = ace.edit("editor-ci", {
		theme: "ace/theme/monokai",
		mode: "ace/mode/csharp",
		showPrintMargin: false,
		//readOnly: true
	});

class PlaygroundHost extends CiSemaHost
{
	reportError(filename, startLine, startColumn, endLine, endColumn, message)
	{
		this.annotations.push({ row: startLine - 1, column: startColumn - 1, type: "error", text: message });
		// editor.session.addMarker(new ace.Range(startLine - 1, startColumn - 1, endLine - 1, endColumn - 1), "ace_error-marker", "text", true);
	}
}

// editor.session.addMarker(new Range(0, 14, 0, 16), "ace_error-marker", "text", true);
// editor.session.setAnnotations([{ row: 0, column: 1, text: "foobar", type: "error" }]);

function transpile()
{
//	for (const markerId of Object.keys(editor.session.getMarkers()))
//		editor.session.removeMarker(markerId);
	const input = new TextEncoder().encode(editor.session.doc.getValue());
	const host = new PlaygroundHost();
	host.annotations = [];
	const system = CiSystem.new();
	const parser = new CiParser();
	parser.setHost(host);
	parser.program = new CiProgram();
	parser.program.parent = system;
	parser.program.system = system;
	parser.parse("foo.ci", input, input.length);
	if (host.annotations.length == 0) {
		const sema = new CiSema();
		sema.setHost(host);
		sema.process(parser.program);
	}
	editor.session.setAnnotations(host.annotations);
}

editor.session.on("change", transpile);
