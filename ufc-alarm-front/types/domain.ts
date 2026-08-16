export type CardSection = "main" | "prelim";

export interface Fighter {
  name: string;
  nickname?: string;
  record?: string;
  photoUrl?: string;
  country?: string;
  flagEmoji?: string;
  corner: "red" | "blue";
}

export interface Fight {
  boutId: string;
  weightClass?: string;
  titleBout: boolean;
  cardSection: CardSection;
  cardPosition: string;
  boutOrder: number;
  fighterRed: Fighter;
  fighterBlue: Fighter;
  /** Only set when both sides have a real value — Cito rarely populates this. */
  odds?: { red: number; blue: number };
}

export interface UpcomingEvent {
  slug: string;
  title: string;
  shortTitle: string;
  promotionLabel: string;
  date: Date | null;
  dateLabel?: string;
  venue?: string;
  location?: string;
  posterUrl?: string;
  mainEvent?: Fight;
  mainCard: Fight[];
  prelimCard: Fight[];
}
