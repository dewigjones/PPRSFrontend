export interface User {
    id?: number;
    name: string;
    img_path: string;
}

export default function Avatar({img_path} : User) {
    return (
        <img src={img_path} className="avatar"/>
    );
}