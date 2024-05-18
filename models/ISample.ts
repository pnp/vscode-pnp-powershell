import { IAuthor } from './IAuthor';


export interface ISample {
    title: string;
    url: string;
    rawUrl: string;
    description: string;
    image: string;
    type: string;
    tags: string[];
    authors: IAuthor[];
}