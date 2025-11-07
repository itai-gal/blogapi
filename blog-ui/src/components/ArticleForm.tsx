import React, { useEffect, useState } from "react";

export type ArticleFormValues = {
    title: string;
    content: string;
};

type Props = {
    initial?: Partial<ArticleFormValues>;
    loading?: boolean;
    onSubmit: (values: ArticleFormValues) => Promise<void> | void;
    submitLabel?: string;
};

const ArticleForm: React.FC<Props> = ({
    initial,
    loading,
    onSubmit,
    submitLabel = "Save",
}) => {
    const [values, setValues] = useState<ArticleFormValues>({
        title: initial?.title ?? "",
        content: initial?.content ?? "",
    });

    useEffect(() => {
        // if initial changes, update form values
        setValues({
            title: initial?.title ?? "",
            content: initial?.content ?? "",
        });
    }, [initial?.title, initial?.content]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            title: values.title.trim(),
            content: values.content,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="stack" style={{ gap: 12 }}>
            <input
                className="input"
                placeholder="Title"
                value={values.title}
                onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
                required
            />
            <textarea
                className="input"
                placeholder="Content"
                rows={10}
                value={values.content}
                onChange={(e) => setValues((v) => ({ ...v, content: e.target.value }))}
                required
            />
            <button className="btn primary" disabled={!!loading}>
                {loading ? "..." : submitLabel}
            </button>
        </form>
    );
};

export default ArticleForm;
