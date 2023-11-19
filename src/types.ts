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
}

export interface BuildLinkTreeType extends LinkTreeType{
	parentRef?: BuildLinkTreeType;
}

export interface SlideType {
	link: LinkTreeType;
	type: string;
}
