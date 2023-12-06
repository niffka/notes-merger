import { LatexTemplate } from "./template"

export class PEFTemplate extends LatexTemplate {

	template: string;
	attributes: Record<string, string> = {};

	allowedTypes = ["bachelor", "master", "dissertation"];

	constructor(rawMetadata: string, latexBody: string, latexCitations: string) {
		super();

		this.parseMetadata(rawMetadata);

		this.template = `
%####### Spočítání znaků s mezerami na Linuxu: 
%####### $ pdftotext document.pdf -enc UTF-8 - | wc -m 
% 1 AA = 36 000 znaků = 5 600 - 6 200 slov
% 2,5 AA = 90 000 znaků

\\documentclass[twoside,12pt]{article}%
% pro tisk po jedné straně papíru je potřebné odstranit volbu twoside
\\usepackage{xdipp}
\\usepackage{graphicx} %package to manage images
\\graphicspath{ {./obrazky/} }
% \\cestina % implicitní
% \\slovencina
% \\english
\\pismo{Bookman} % nic (=LModern), Academica, Baskerville, Bookman, Cambria, Comenia, Constantia, Palatino, Times
% \\dvafonty % implicitně je \\jedenfont
% \\technika
% \\beletrie % implicitní
\\popiskyzkr
% \\popisky % implicitní 
\\pagestyle{headings} % implicitní

\\cislovat{4}
% \\bakalarska % implicitní
% \\diplomova
% \\disertacni
${this.thesisType()}

\\brokenpenalty 10000

\\begin{document}

${this.title()}\n
${this.acknowledgment()}\n
${this.declaration()}\n
${this.abstract()}\n
${this.keywords()}\n

\\obsah
\\listoffigures
\\lstlistoflistings
		

${latexBody}


${latexCitations}

\end{document}
`;
	}

	parseMetadata(note: string) {
		const rows = note.split("\n");
		
		rows.forEach((row: string) => {
			const [key, value] = row.split(":")
			if (value)
				this.attributes[key] = value.trim();
		});
	}
	
	thesisType(): string {
		const { thesis } = this.attributes;
		if(thesis === "bachelor") 
			return `\\bakalarska`;
		
		if (thesis === "master")
			return `\\diplomova`;

		if (thesis === "dissertation")
			return `\\disertacni`;

		return `\\diplomova`;
	}

	title(): string {
		const { title, author, supervisor, locationAndDate} = this.attributes;
		return `\\titul{${title}}{${author}}{${supervisor}}{${locationAndDate}}\n`;
	}

	acknowledgment(): string {
		return `\\podekovani{${this.attributes.acknowledgment}}\n`;
	}

	declaration(): string {
		return `\\prohlasenimuz{${this.attributes.declaration}}\n`;
	}

	abstract(): string {
		return `
\\abstract{${this.attributes["abstract-title-en"]}}\n
{${this.attributes["abstract-desc-en"]}}\n\n

\\abstrakt{${this.attributes["abstract-title-cs"]}}\n
{${this.attributes["abstract-desc-cs"]}}
		`;
	}

	keywords(): string {
		return `
\\klslova{${this.attributes["keywords-cs"]}}\n
\\keywords{${this.attributes["keywords-en"]}}\n`
	}

	getTemplate(): string {
		return this.template;
	}
}
