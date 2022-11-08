import ts from 'typescript';

/**
 * A TypeScript transform that compiles classes marked with @NativeClass as es5 & commonjs
 *
 * @param ctx
 */
export default function (ctx: ts.TransformationContext) {
	function isNativeClassExtension(node: ts.ClassDeclaration) {
		return (
			ts.canHaveDecorators(node) &&
			ts.getDecorators(node) &&
			ts.getDecorators(node).filter((d) => {
				const fullText = d.getFullText().trim();
				return fullText.indexOf('@NativeClass') > -1;
			}).length > 0
		);
	}
	function visitNode(node: ts.Node): ts.Node {
		if (ts.isClassDeclaration(node) && isNativeClassExtension(node)) {
			return createHelper(node);
		}
		return ts.visitEachChild(node, visitNode, ctx);
	}

	function createHelper(node: ts.Node) {
		// we remove the decorator for now!
		return ts.factory.createIdentifier(
			ts
				.transpileModule(
					node.getText().replace(/@NativeClass(\((.|\n)*?\))?/gm, ''),
					{
						compilerOptions: {
							noEmitHelpers: true,
							module: ts.ModuleKind.ESNext,
							target: ts.ScriptTarget.ES5,
						},
					}
				)
				.outputText.replace(
					/(Object\.defineProperty\(.*?{.*?)(enumerable:\s*false)(.*?}\))/gs,
					'$1enumerable: true$3'
				)
		);
	}

	return (source: ts.SourceFile) =>
		ts.factory.updateSourceFile(
			source,
			ts.visitNodes(source.statements, visitNode)
		);
}
