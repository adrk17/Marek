import { BackgroundConfig } from "./ModelLoader";

const X3D_NS = "http://www.web3d.org/specifications/x3d-namespace";

type Vec3 = { x: number; y: number; z: number };

export class BackgroundManager {
    private readonly config: BackgroundConfig;
    private readonly offset: Vec3;
    private readonly follow: { x: boolean; y: boolean; scaleX: number; scaleY: number };
    private readonly repeat: { s: number; t: number };
    private readonly scroll: { x: number; y: number };
    private readonly baseTranslation: Vec3;
    private readonly ready: boolean;

    private transform: Element | null;
    private appearance: Element | null;
    private material: Element | null;
    private texture: Element | null;
    private textureTransform: Element | null;

    constructor(config: BackgroundConfig) {
        this.config = config;
        this.transform = document.getElementById("background-transform");
        this.appearance = document.getElementById("background-appearance");
        this.material = document.getElementById("background-material");
        this.texture = document.getElementById("background-texture");
        this.textureTransform = document.getElementById("background-texture-transform");

        this.baseTranslation = parseVec3(this.transform?.getAttribute("translation"));
        this.offset = {
            x: config.offset?.x ?? 0,
            y: config.offset?.y ?? 0,
            z: config.offset?.z ?? 0
        };
        this.follow = {
            x: config.follow?.x ?? true,
            y: config.follow?.y ?? false,
            scaleX: config.follow?.scaleX ?? 1,
            scaleY: config.follow?.scaleY ?? 1
        };
        this.repeat = {
            s: config.repeat?.s ?? 1,
            t: config.repeat?.t ?? 1
        };
        this.scroll = {
            x: config.textureScroll?.x ?? 0,
            y: config.textureScroll?.y ?? 0
        };

        this.ready = Boolean(this.transform && this.appearance && this.material);
        if (!this.ready) {
            console.warn("Background elements not found in DOM");
            return;
        }

        this.applyInitialLook();
    }

    update(x: number, y?: number): void {
        if (!this.ready || !this.transform) return;

        const dx = this.follow.x ? x * this.follow.scaleX : 0;
        const dy = this.follow.y ? (y ?? 0) * this.follow.scaleY : 0;
        const tx = this.baseTranslation.x + this.offset.x + dx;
        const ty = this.baseTranslation.y + this.offset.y + dy;
        const tz = this.baseTranslation.z + this.offset.z;
        this.transform.setAttribute("translation", `${fmt(tx)} ${fmt(ty)} ${fmt(tz)}`);

        if (this.scroll.x === 0 && this.scroll.y === 0) return;
        const transformNode = this.ensureTextureTransform();
        if (!transformNode) return;

        const u = this.scroll.x ? wrap01(x * this.scroll.x) : 0;
        const v = this.scroll.y ? wrap01((y ?? 0) * this.scroll.y) : 0;
        transformNode.setAttribute("translation", `${u.toFixed(4)} ${v.toFixed(4)}`);
    }

    private applyInitialLook(): void {
        if (this.config.textureUrl?.trim()) {
            this.applyTexture(this.config.textureUrl.trim());
        } else {
            this.applyColor(this.config.fallbackColor);
        }
    }

    private applyTexture(url: string): void {
        const textureNode = this.ensureTextureNode();
        const transformNode = this.ensureTextureTransform();
        if (!textureNode || !transformNode || !this.material) return;

        textureNode.setAttribute("repeatS", "true");
        textureNode.setAttribute("repeatT", "true");
        textureNode.setAttribute("url", `"${url}"`);
        this.material.setAttribute("diffuseColor", "1 1 1");
        this.material.setAttribute("emissiveColor", "1 1 1");
        transformNode.setAttribute("scale", `${this.repeat.s} ${this.repeat.t}`);
    }

    private applyColor(color: string): void {
        if (!this.material) return;
        const value = (color ?? "0 0 0").trim() || "0 0 0";
        this.material.setAttribute("diffuseColor", value);
        this.material.setAttribute("emissiveColor", value);

        if (this.texture?.parentElement) {
            this.texture.parentElement.removeChild(this.texture);
        }
        this.texture = null;
    }

    private ensureTextureNode(): Element | null {
        if (this.texture) {
            if (!this.texture.parentElement && this.appearance) {
                this.appearance.appendChild(this.texture);
            }
            return this.texture;
        }

        const node = document.createElementNS(X3D_NS, "ImageTexture");
        node.setAttribute("id", "background-texture");
        if (this.appearance) {
            this.appearance.appendChild(node);
        }
        this.texture = node;
        return node;
    }

    private ensureTextureTransform(): Element | null {
        if (this.textureTransform) {
            if (!this.textureTransform.parentElement && this.appearance) {
                this.appearance.appendChild(this.textureTransform);
            }
            return this.textureTransform;
        }

        const node = document.createElementNS(X3D_NS, "TextureTransform");
        node.setAttribute("id", "background-texture-transform");
        node.setAttribute("scale", `${this.repeat.s} ${this.repeat.t}`);
        node.setAttribute("translation", "0 0");
        if (this.appearance) {
            this.appearance.appendChild(node);
        }
        this.textureTransform = node;
        return node;
    }
}

function parseVec3(value?: string | null): Vec3 {
    if (!value) return { x: 0, y: 0, z: 0 };
    const parts = value.trim().split(/\s+/).map(Number);
    if (parts.length < 3 || parts.some(Number.isNaN)) return { x: 0, y: 0, z: 0 };
    return { x: parts[0], y: parts[1], z: parts[2] };
}

function wrap01(value: number): number {
    const wrapped = value % 1;
    return wrapped < 0 ? wrapped + 1 : wrapped;
}

function fmt(value: number): string {
    return value.toFixed(3).replace(/\.?0+$/, "");
}
