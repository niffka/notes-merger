import { XCircle, Menu, createElement, IconNode } from 'lucide';

export class Icon {
	element: SVGElement;

	constructor(icon: IconNode, color: string = "#333") {
		this.element = createElement(icon);
		this.element.setAttribute('stroke', color);
		return this;
	}
}

export class ErrorIcon{
	element: SVGElement;

	constructor() {
		this.element = new Icon(XCircle, "#c70c0f").element;
		return this;
	}
}
