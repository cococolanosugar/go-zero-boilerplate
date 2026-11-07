export interface DocHeadingVO {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface DocCalloutVO {
  type: "note" | "tip" | "warning" | "important";
  title?: string;
  text: string;
}

export interface DocCodeBlockVO {
  language: string;
  code: string;
  filename?: string;
}

export interface DocSectionVO {
  heading?: DocHeadingVO;
  paragraphs?: string[];
  callout?: DocCalloutVO;
  codeBlock?: DocCodeBlockVO;
  list?: string[];
}

export interface DocChapterVO {
  id: string;
  categoryId: string;
  title: string;
  badge?: string;
  readTime: string;
  summary: string;
  updatedAt: string;
  headings: DocHeadingVO[];
  sections: DocSectionVO[];
}

export interface DocCategoryVO {
  id: string;
  title: string;
  icon: string;
  description: string;
  chapters: DocChapterVO[];
}
