# Notes Merger
![notes merger preview](https://github.com/niffka/notes-merger/blob/main/src/images/generate_markdown.png)


This plugin enables you to generate a content tree structure by traversing all links and nesting them within notes. Merge multiple Markdown files into a single, unified Markdown file based on the generated tree structure. Create a template for `obsidian advanced slides` plugin (https://mszturc.github.io/obsidian-advanced-slides/). Translate markdown file into XeLatex with usage of custom latex templates.

## Generate merging preview
Generate a content tree structure by traversing all links and nesting them within notes. Generated structure can be updated in an interactive preview. Hierarchy structure visually represents the connections between notes and the links. There are two types of links:

- Inline Links: These are links found within the note that expand the existing structure without creating nesting (notes expand without creating additional layers). They are replaced in the same location where they were initially found. If discovered in the subsequent text, the note will be positioned on the nearest new line.

- Keyword Links: These links are associated with a specific keyword, which can be configured in the settings. This configuration allows for the creation of a nested structure, with links under the designated keyword forming a sublevel of the current note.

![Inline and Keyword Links](https://github.com/niffka/notes-merger/blob/dev/src/images/inline_and_keyword_links.png)


### Generate markdown
Generating markdown file is driven by the structure created in previous step and by incorporating user's specified preferences and settings. After saving a file, user will be redirected to the note.

![generate markdown modal](https://github.com/niffka/notes-merger/blob/dev/src/images/generate_markdown_modal.png)

### Generate slideshow
Generate slideshow template that is compatible with `obsidian advanced slides` plugin (https://mszturc.github.io/obsidian-advanced-slides/).

![generate slideshow](https://github.com/niffka/notes-merger/blob/dev/src/images/generate_slideshow.png)

## Generate latex
Translate markdown file into XeLatex file (.tex). Supported versions are 2018, 2019, 2022, 2023. User can specify image folder in the plugin settings. All images are copied in the translation process into the image folder.
TBA

### Generate plain latex
Basic translation of markdown commands and images    into XeLatex file.
TBA 

### Generate Latex With Template
Include specified template in the generation process.
TBA 

## Settings
Default settings: 
![default notes merger settings](https://github.com/niffka/notes-merger/blob/dev/src/images/default_settings.png)
