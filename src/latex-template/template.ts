export abstract class LatexTemplate {

	abstract parseMetadata(rawMetadata: string): void;

	abstract title(): string;

	abstract acknowledgment(): string;

	abstract declaration(): string;

	abstract abstract(): string;

	abstract keywords(): string;

	abstract thesisType() :string;

	abstract getThesis(): string;
}
