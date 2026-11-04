import { ArticleForm } from "@/components/admin/editor/ArticleForm";

export default function EditArticlePage({ params }: { params: { id: string } }) {
  return <ArticleForm id={params.id} />;
}
