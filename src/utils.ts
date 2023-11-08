import { readFileSync } from 'fs';
import { FileSystemAdapter, TAbstractFile, TFile } from 'obsidian';

export const fixSpaceInName = (name: string) => {
	return name.replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/, " ").trim();
}

export const getNoteByName = (name: string, loadedFiles: TAbstractFile[]) => {
	const loadedFile = loadedFiles.find((file: TFile) => file.basename === name);
	 
	const fullPath = (app.vault.adapter as FileSystemAdapter).getFullPath(name);

	if (!loadedFile)
		return "";

	const absolutePath = fullPath.replace(name, loadedFile.path.replace('/', '\\'))
	const note = readFileSync(absolutePath, { encoding: 'utf8' });
	return note; // text of note
}
