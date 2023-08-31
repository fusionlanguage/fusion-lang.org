import { FuParser, FuProgram, FuSystem, FuSema, GenC, GenCpp, GenCs, GenD, GenJava, GenJs, GenPy, GenSwift, GenTs, GenHost } from "./libfut.js";

const example2file = {
	hello: "hello.fu",
	qoi: "QOI.fu",
	qoa: "QOA.fu",
	datamatrix: "DataMatrixEncoder.fu",
	ray: "RayTracer.fu"
};

function getEditorComponent(filename)
{
	return {
			type: "component",
			isClosable: false,
			id: filename,
			title: filename,
			componentName: "editor",
			componentState: { filename: filename }
		};
}

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
			content: [
				{
					type: "stack",
					width: 1,
					id: "stack-fu",
					content: [ getEditorComponent("hello.fu") ]
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
const layout = new GoldenLayout(layoutConfig, document.getElementById("goldenLayout"));
layout.registerComponent("editor", function(container, componentState) {
		container.getElement().html(`<div id="editor-${componentState.filename}" class="editor"></div>`);
	});
layout.init();
addEventListener("resize", e => layout.updateSize());

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
	hasErrors = false;
	annotations = new Map();
	outputs = new Map();

	reportError(filename, startLine, startColumn, endLine, endColumn, message)
	{
		this.hasErrors = true;
		if (!this.annotations.has(filename))
			this.annotations.set(filename, []);
		this.annotations.get(filename).push({ row: startLine - 1, column: startColumn - 1, type: "error", text: message });
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

function emit(program, host, gen, filename, lang, mode)
{
	host.outputs.clear();
	gen.namespace = "";
	gen.outputFile = filename + lang;
	gen.setHost(host);
	host.hasErrors = false;
	gen.writeProgram(program);
	if (!host.hasErrors) {
		const stack = layout.root.getItemsById("stack-" + lang)[0];
		for (const item of stack.getItemsByFilter(item => !host.outputs.has(item.config.id)))
			item.remove();
		for (const [filename, w] of host.outputs) {
			if (stack.getItemsById(filename).length == 0)
				stack.addChild(getEditorComponent(filename));
			ace.edit("editor-" + filename, {
					theme: "ace/theme/monokai",
					mode: "ace/mode/" + mode,
					showPrintMargin: false,
					useWorker: false,
					readOnly: true
				}).session.doc.setValue(w.toString());
		}
	}
}

function transpile()
{
//	for (const markerId of Object.keys(sourceEditor.session.getMarkers()))
//		sourceEditor.session.removeMarker(markerId);
	const host = new PlaygroundHost();
	const system = FuSystem.new();
	const parser = new FuParser();
	parser.setHost(host);
	parser.program = new FuProgram();
	parser.program.parent = system;
	parser.program.system = system;
	const sources = layout.root.getItemsById("stack-fu")[0].contentItems;
	for (const item of sources) {
		const filename = item.config.id;
		const input = new TextEncoder().encode(ace.edit("editor-" + filename).session.doc.getValue());
		parser.parse(filename, input, input.length);
	}
	if (!host.hasErrors) {
		const sema = new FuSema();
		sema.setHost(host);
		sema.process(parser.program);
		if (!host.hasErrors) {
			const filename = sources.length == 1 ? sources[0].config.id.replace(/fu$/, "") : "output.";
			emit(parser.program, host, new GenC(), filename, "c", "c_cpp");
			emit(parser.program, host, new GenCpp(), filename, "cpp", "c_cpp");
			emit(parser.program, host, new GenCs(), filename, "cs", "csharp");
			emit(parser.program, host, new GenD(), filename, "d", "d");
			emit(parser.program, host, new GenJava(), filename, "java", "java");
			emit(parser.program, host, new GenJs(), filename, "js", "javascript");
			emit(parser.program, host, new GenPy(), filename, "py", "python");
			emit(parser.program, host, new GenSwift(), filename, "swift", "swift");
			emit(parser.program, host, new GenTs().withGenFullCode(), filename, "ts", "typescript");
		}
	}
	for (const item of sources) {
		const filename = item.config.id;
		ace.edit("editor-" + filename).session.setAnnotations(host.annotations.get(filename) || []);
	}
}

const sourceEditor = ace.edit("editor-hello.fu", {
		theme: "ace/theme/monokai",
		mode: "ace/mode/csharp",
		showPrintMargin: false
	});
sourceEditor.session.on("change", transpile);

function setSource(filename, content)
{
	sourceEditor.session.doc.setValue(content);
}

function loadSample()
{
	const example = decodeURIComponent(location.hash).substr(1);
	const filename = example2file[example] || "hello.fu";
	const request = new XMLHttpRequest();
	request.open("GET", "examples/" + filename, true);
	request.onload = e => {
			if (request.status == 200 || request.status == 0)
				setSource(filename, request.response);
		};
	request.send();
}

addEventListener("load", loadSample);
addEventListener("hashchange", loadSample);
document.getElementById("sampleSelect").addEventListener("change", e => location.assign("#" + e.target.value));
