import { ISample } from '../../../../models/ISample';

export interface IAppState {
    loading: boolean;
    samples: ISample[] | null;
    searchQueryInput: string;
}