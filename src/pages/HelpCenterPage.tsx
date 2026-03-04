import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Search, ArrowLeft, Play, CheckCircle2, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { categories, tutorials, Tutorial } from '@/data/tutorials';

const WHATSAPP_NUMBER = '5511999999999';

export function HelpCenterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  const filteredTutorials = useMemo(() => {
    if (!selectedCategory && !searchTerm) return [];
    return tutorials.filter((tut) => {
      const matchesCategory = selectedCategory ? tut.category === selectedCategory : true;
      const matchesSearch = searchTerm
        ? t(tut.title).toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm, t]);

  const showTutorialList = selectedCategory || searchTerm;

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Preciso de ajuda com o Obra Certa.')}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-secondary text-secondary-foreground shadow-md">
        <div className="container py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="text-secondary-foreground hover:bg-secondary-foreground/10 w-8 h-8 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-base">{t('helpCenter.title')}</h1>
          </div>
        </div>
      </header>

      <main className="container py-6 pb-24 max-w-2xl mx-auto">
        {/* Search */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3 text-center">{t('helpCenter.searchHeading')}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('helpCenter.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value) setSelectedCategory(null);
              }}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Categories Grid */}
        {!showTutorialList && (
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md active:scale-[0.98]"
                onClick={() => setSelectedCategory(cat.id)}
              >
                <CardContent className="p-4 text-center">
                  <span className="text-3xl mb-2 block">{cat.icon}</span>
                  <h3 className="font-semibold text-sm">{t(cat.titleKey)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t(cat.descriptionKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tutorial List */}
        {showTutorialList && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchTerm('');
                }}
                className="gap-1 text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('helpCenter.backToCategories')}
              </Button>
            </div>

            {filteredTutorials.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t('helpCenter.noResults')}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredTutorials.map((tut) => (
                  <Card
                    key={tut.id}
                    className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md active:scale-[0.98]"
                    onClick={() => setSelectedTutorial(tut)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <span className="text-2xl">{tut.categoryIcon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{t(tut.title)}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tut.steps.length} {t('helpCenter.steps')}
                        </p>
                      </div>
                      <Play className="w-5 h-5 text-primary shrink-0" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Tutorial Viewer Sheet */}
      <Sheet open={!!selectedTutorial} onOpenChange={(open) => !open && setSelectedTutorial(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
          {selectedTutorial && (
            <div className="max-w-lg mx-auto pb-24">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-lg text-left">{t(selectedTutorial.title)}</SheetTitle>
              </SheetHeader>

              {/* Video placeholder */}
              <div className="w-full aspect-video bg-muted rounded-xl flex items-center justify-center mb-6">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Play className="w-7 h-7 text-primary" />
                  </div>
                  <span className="text-xs">{t('helpCenter.videoComingSoon')}</span>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {selectedTutorial.steps.map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">{t(step)}</p>
                  </div>
                ))}
              </div>

              {selectedTutorial.note && (
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs text-muted-foreground">{t(selectedTutorial.note)}</p>
                </div>
              )}

              {/* WhatsApp CTA */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full gap-2" size="lg">
                    <MessageCircle className="w-5 h-5" />
                    {t('helpCenter.whatsappCta')}
                  </Button>
                </a>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
