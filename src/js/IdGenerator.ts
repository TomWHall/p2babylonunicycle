let id = 0;

export default function getId(): string {
    id++;
    return id.toString();
}