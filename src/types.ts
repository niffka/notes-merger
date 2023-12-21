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
}

export interface BuildLinkTreeType extends LinkTreeType{
	parentRef?: BuildLinkTreeType;
}

export interface SlideType {
	link: LinkTreeType;
	type: string;
}

export interface CitationType {
	authors: string[];
	date: string;
	distribution: string;
	edition: string;
	format: string;
	inline: string;
	isbn: string;
	label: string; 
	publisherInfo: string;
	source: string;
	subTitle: string;
	title: string;
}

export interface LatexImageType {
	raw: string;
	desc?: string;
	name: string;
	path: string;
}

export interface LatexErrorType {
	type: string;
	item: string[];
	message: string;
}
