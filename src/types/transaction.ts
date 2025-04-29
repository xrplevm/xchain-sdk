export type Transaction = {
    hash: string;
    confirmed: boolean;
};

export type Confirmed<T extends Transaction> = T & {
    confirmed: true;
};

export type Unconfirmed<T extends Transaction> = {
    hash: string;
    confirmed: false;
    wait: () => Promise<Confirmed<T>>;
};
