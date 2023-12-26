import { XCircle, createElement, IconNode, AlertTriangle } from 'lucide';

export class Icon {
	element: SVGElement;

	constructor(icon: IconNode, color: string = "#333") {
		this.element = createElement(icon);
		this.element.setAttribute('stroke', color);
		return this;
	}
}

export class ErrorIcon {
	element: SVGElement;

	constructor(color = "#c70c0f") {
		this.element = new Icon(XCircle, color).element;
		return this;
	}
}

export class WarningIcon {
	element: SVGElement;

	constructor(color = "#8c6f20") {
		this.element = new Icon(AlertTriangle, color).element;
		return this;
	}
}