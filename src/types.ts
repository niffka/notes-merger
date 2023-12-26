import { TAbstractFile } from "obsidian";

export interface LinkTreeType {
	name: string;
	parent?: string | undefined;
	children: LinkTreeType[];
	index: boolean;
	exists: boolean;
	inline: boolean;
	level?: number;
	order?: number;
	path: string;
	note: string;
	incomplete: boolean;
}

export interface BuildLinkTreeType extends LinkTreeType{
	parentRef?: BuildLinkTreeType;
}

export interface SlideType {
	link: LinkTreeType;
	type: string;
}

export interface CitationType {
	label: string;
	type: string; // book | web
	inline: string;
	authors: string[];
	title: string;
	publishedPlace: string;
	publisher: string;
	date: string; // [cit. 11.11.2023]
	source: string;
}

export interface WebCitationType extends CitationType {
	webDomain: string;
	publishedDate: string;
	revisionDate: string;
}

export interface BookCitationType extends CitationType {
	publishedYear: string;
	edition: string;
	isbn: string;
	format: string;
}

export interface LatexImageType {
	raw: string;
	desc?: string;
	name: string;
	source?: string;
	path: string;
}

export interface LatexErrorType {
	type: string;
	item: string[];
	message: string;
}

export interface LatexImagesStatus{
	correct: LatexImageType[];
	incorrect: LatexImageType[];
	count: number;
}

export interface AttachmentsType {
	attachments: TAbstractFile[];
	latex: string;
	images: LatexImagesStatus;
}
