'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { CopyButton } from '../../components/ui/copy-button';

interface ChangelogEmbedProps {
  changelogId: string;
  repoName: string;
  isPublic?: boolean;
}

export function ChangelogEmbed({ changelogId, repoName, isPublic = false }: ChangelogEmbedProps) {
  const [isPublicState, setIsPublicState] = useState(isPublic);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the base URL for the API
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : '';
  
  const apiUrl = `${baseUrl}/api/changelog/${changelogId}/public`;
  const iframeUrl = `${baseUrl}/embed/changelog/${changelogId}`;
  
  const apiCode = `fetch('${apiUrl}')
  .then(response => response.json())
  .then(data => {
    // Use the changelog data
    console.log(data);
  });`;
  
  const markdownCode = `fetch('${apiUrl}?format=markdown')
  .then(response => response.text())
  .then(markdown => {
    // Use the markdown content
    console.log(markdown);
  });`;
  
  const iframeCode = `<iframe 
  src="${iframeUrl}" 
  width="100%" 
  height="500" 
  frameborder="0"
  title="Changelog for ${repoName}"
></iframe>`;
  
  const scriptCode = `<div id="changelog-container" data-repo="${repoName}"></div>
<script src="${baseUrl}/js/changelog-widget.js" data-id="${changelogId}"></script>`;

  const handleMakePublic = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/changelog/${changelogId}/visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic: true }),
      });
      
      if (response.ok) {
        setIsPublicState(true);
      } else {
        console.error('Failed to update visibility:', await response.json());
      }
    } catch (error) {
      console.error('Failed to update visibility:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border p-4 mt-6">
      <h3 className="text-lg font-medium mb-4">Integrate This Changelog</h3>
      
      {!isPublicState ? (
        <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-sm text-yellow-700">
            This changelog is currently private. Make it public to enable embedding.
          </p>
          <button 
            className="mt-2 px-3 py-1 bg-yellow-100 hover:bg-yellow-200 rounded text-sm"
            onClick={handleMakePublic}
            disabled={isLoading}
          >
            {isLoading ? 'Making Public...' : 'Make Public'}
          </button>
        </div>
      ) : (
        <Tabs defaultValue="iframe">
          <TabsList className="mb-4">
            <TabsTrigger value="iframe">iFrame Embed</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
            <TabsTrigger value="script">Script Tag</TabsTrigger>
          </TabsList>
          
          <TabsContent value="iframe" className="space-y-4">
            <p className="text-sm text-gray-600">
              Embed the changelog directly in your website with an iframe:
            </p>
            <div className="bg-gray-50 p-3 rounded relative">
              <CopyButton text={iframeCode} />
              <pre className="text-sm overflow-x-auto">{iframeCode}</pre>
            </div>
          </TabsContent>
          
          <TabsContent value="api" className="space-y-4">
            <p className="text-sm text-gray-600">
              Fetch the changelog data via API:
            </p>
            <div className="bg-gray-50 p-3 rounded relative">
              <CopyButton text={apiCode} />
              <pre className="text-sm overflow-x-auto">{apiCode}</pre>
            </div>
          </TabsContent>
          
          <TabsContent value="markdown" className="space-y-4">
            <p className="text-sm text-gray-600">
              Get raw Markdown to include in your documentation:
            </p>
            <div className="bg-gray-50 p-3 rounded relative">
              <CopyButton text={markdownCode} />
              <pre className="text-sm overflow-x-auto">{markdownCode}</pre>
            </div>
          </TabsContent>
          
          <TabsContent value="script" className="space-y-4">
            <p className="text-sm text-gray-600">
              Add a script tag to automatically render the changelog:
            </p>
            <div className="bg-gray-50 p-3 rounded relative">
              <CopyButton text={scriptCode} />
              <pre className="text-sm overflow-x-auto">{scriptCode}</pre>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 