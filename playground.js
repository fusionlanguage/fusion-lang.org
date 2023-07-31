import { CiParser, CiProgram, CiSystem, CiSema, GenC, GenCpp, GenCs, GenD, GenJava, GenJs, GenPy, GenSwift, GenTs, GenHost } from "./cito.js";

function getOutputRow(lang1, lang2, lang3)
{
	return {
			type: "row",
			content: [
				{ type: "stack", isClosable: false, id: "stack-" + lang1 },
				{ type: "stack", isClosable: false, id: "stack-" + lang2 },
				{ type: "stack", isClosable: false, id: "stack-" + lang3 }]
		};
}

const layoutConfig = {
		settings: {
			reorderEnabled: false,
			showPopoutIcon: false
		},
		content: [{
			type: "row",
			content: [{
					title: "hello.ci",
					type: "component",
					width: 1,
					isClosable: false,
					componentName: "editor",
					componentState: { filename: "hello.ci" }
				},
				{
					type: "column",
					width: 3,
					content: [
						getOutputRow("c", "cpp", "cs"),
						getOutputRow("d", "java", "js"),
						getOutputRow("py", "swift", "ts")
					]
				}]
			}]
	};
const layout = new GoldenLayout(layoutConfig);
layout.registerComponent("editor", function(container, componentState) {
		container.getElement().html(`<div id="editor-${componentState.filename}" class="editor"></div>`);
	});
layout.init();

const sourceEditor = ace.edit("editor-hello.ci", {
		theme: "ace/theme/monokai",
		mode: "ace/mode/csharp",
		showPrintMargin: false
	});

class StringWriter
{
	#buf = "";

	write(s)
	{
		this.#buf += s;
	}

	toString()
	{
		return this.#buf;
	}
}

class PlaygroundHost extends GenHost
{
	outputs = new Map();

	reportError(filename, startLine, startColumn, endLine, endColumn, message)
	{
		this.annotations.push({ row: startLine - 1, column: startColumn - 1, type: "error", text: message });
		// sourceEditor.session.addMarker(new ace.Range(startLine - 1, startColumn - 1, endLine - 1, endColumn - 1), "ace_error-marker", "text", true);
	}

	createFile(directory, filename)
	{
		const w = new StringWriter();
		this.outputs.set(filename, w);
		return w;
	}

	closeFile()
	{
	}
}

// sourceEditor.session.addMarker(new Range(0, 14, 0, 16), "ace_error-marker", "text", true);
// sourceEditor.session.setAnnotations([{ row: 0, column: 1, text: "foobar", type: "error" }]);

function emit(program, host, gen, lang, mode)
{
	host.outputs.clear();
	gen.namespace = "";
	gen.outputFile = "hello." + lang;
	gen.setHost(host);
	const errorCount = host.annotations.length;
	gen.writeProgram(program);
	if (host.annotations.length == errorCount) {
		const stack = layout.root.getItemsById("stack-" + lang)[0];
		for (const item of stack.getItemsByFilter(item => !host.outputs.has(item.config.id)))
			item.remove();
		for (const [filename, w] of host.outputs) {
			if (stack.getItemsById(filename).length == 0) {
				stack.addChild({
						id: filename,
						title: filename,
						type: "component",
						isClosable: false,
						componentName: "editor",
						componentState: { filename: filename }
					});
			}
			ace.edit("editor-" + filename, {
					theme: "ace/theme/monokai",
					mode: "ace/mode/" + mode,
					showPrintMargin: false,
					readOnly: true
				}).session.doc.setValue(w.toString());
		}
	}
}

function transpile()
{
//	for (const markerId of Object.keys(sourceEditor.session.getMarkers()))
//		sourceEditor.session.removeMarker(markerId);
	const input = new TextEncoder().encode(sourceEditor.session.doc.getValue());
	const host = new PlaygroundHost();
	host.annotations = [];
	const system = CiSystem.new();
	const parser = new CiParser();
	parser.setHost(host);
	parser.program = new CiProgram();
	parser.program.parent = system;
	parser.program.system = system;
	parser.parse("hello.ci", input, input.length);
	if (host.annotations.length == 0) {
		const sema = new CiSema();
		sema.setHost(host);
		sema.process(parser.program);
		if (host.annotations.length == 0) {
			emit(parser.program, host, new GenC(), "c", "c_cpp");
			emit(parser.program, host, new GenCpp(), "cpp", "c_cpp");
			emit(parser.program, host, new GenCs(), "cs", "csharp");
			emit(parser.program, host, new GenD(), "d", "d");
			emit(parser.program, host, new GenJava(), "java", "java");
			emit(parser.program, host, new GenJs(), "js", "javascript");
			emit(parser.program, host, new GenPy(), "py", "python");
			emit(parser.program, host, new GenSwift(), "swift", "swift");
			emit(parser.program, host, new GenTs().withGenFullCode(), "ts", "typescript");
		}
	}
	sourceEditor.session.setAnnotations(host.annotations);
}

sourceEditor.session.on("change", transpile);
