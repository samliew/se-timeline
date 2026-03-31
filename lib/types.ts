export interface TimelineLink {
  text: string;
  url: string;
}

export interface TimelineTag {
  text: string;
  url: string;
  isMse?: boolean;
}

export interface TimelineEvent {
  date_str: string;
  title: string;
  slug?: string;
  type?: string;
  summary?: string;
  body?: string;
  classes?: string[];
  links?: TimelineLink[];
  tags?: TimelineTag[];
  linkedEvent?: string;
  icon?: string;
}

export interface TimelineData {
  items: TimelineEvent[];
}
